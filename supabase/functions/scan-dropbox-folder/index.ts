import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DropboxEntry {
  ".tag": string;
  path_lower: string;
  name: string;
}

interface DropboxListResult {
  entries: DropboxEntry[];
  cursor: string;
  has_more: boolean;
}

async function getDropboxAccessToken(appKey: string, appSecret: string, refreshToken: string): Promise<string> {
  const credentials = btoa(`${appKey}:${appSecret}`);
  const res = await fetch("https://api.dropbox.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dropbox token refresh failed: ${err}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

async function getRootNamespaceId(token: string): Promise<string | null> {
  const res = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data?.root_info?.root_namespace_id ?? null;
}

function buildDropboxHeaders(token: string, rootNamespaceId: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (rootNamespaceId) {
    headers["Dropbox-API-Path-Root"] = JSON.stringify({
      ".tag": "root",
      root: rootNamespaceId,
    });
  }
  return headers;
}

async function getOrCreateSharedLink(
  token: string,
  path: string,
  rootNamespaceId: string | null
): Promise<string | null> {
  const res = await fetch("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", {
    method: "POST",
    headers: buildDropboxHeaders(token, rootNamespaceId),
    body: JSON.stringify({ path }),
  });
  const data = await res.json();
  if (data.url) return data.url.replace("dl=0", "raw=1");
  if (data.error_summary?.startsWith("shared_link_already_exists")) {
    const existing = data.error?.["shared_link_already_exists"]?.metadata?.url;
    return existing ? existing.replace("dl=0", "raw=1") : null;
  }
  return null;
}

// Uses a temporary shared link URL instead of downloading the full buffer,
// avoiding double-memory cost of ArrayBuffer + Base64 conversion.
async function tagImageWithGemini(
  genAI: GoogleGenerativeAI,
  imageUrl: string
): Promise<string[]> {
  // Fetch only enough to pass as inline data — stream in small chunks
  const dlRes = await fetch(imageUrl);
  if (!dlRes.ok) throw new Error(`Image fetch failed: ${dlRes.status}`);

  // Read as stream to avoid holding the full buffer in memory longer than needed
  const reader = dlRes.body!.getReader();
  const chunks: Uint8Array[] = [];
  let totalLen = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLen += value.length;
    // Cap at 4 MB — Gemini Flash handles thumbnails fine
    if (totalLen > 4 * 1024 * 1024) break;
  }
  reader.cancel();

  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  // Minimal Base64 without intermediate string allocation
  let binary = "";
  for (let i = 0; i < merged.length; i++) {
    binary += String.fromCharCode(merged[i]);
  }
  const base64 = btoa(binary);

  const contentType = dlRes.headers.get("content-type") ?? "image/jpeg";
  const mimeType = contentType.startsWith("image/png")
    ? "image/png"
    : contentType.startsWith("image/webp")
    ? "image/webp"
    : "image/jpeg";

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt =
    "Analysiere dieses Bild. Antworte NUR mit einer kommagetrennten Liste von maximal 15 passenden Schlagwörtern auf Deutsch (Materialien, Pflanzen, Stimmung, Farbe, Stil). Keine Einleitung, keine Nummerierung.";
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64, mimeType } },
  ]);

  return result.response
    .text()
    .trim()
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

async function processEntry(
  entry: DropboxEntry,
  dropboxToken: string,
  rootNamespaceId: string | null,
  genAI: GoogleGenerativeAI,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  const sharedLink = await getOrCreateSharedLink(dropboxToken, entry.path_lower, rootNamespaceId);
  if (!sharedLink) throw new Error("Could not create shared link");

  // Use the shared link URL directly — no full download into memory
  const tags = await tagImageWithGemini(genAI, sharedLink);

  const { error: dbError } = await supabase
    .from("dropbox_images_index")
    .upsert(
      {
        dropbox_path: entry.path_lower,
        tags,
        dropbox_shared_link: sharedLink,
        last_scanned_at: new Date().toISOString(),
        status: "scanned",
      },
      { onConflict: "dropbox_path" }
    );

  if (dbError) throw new Error(dbError.message);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;
    const dropboxAppKey = Deno.env.get("DROPBOX_APP_KEY")!;
    const dropboxAppSecret = Deno.env.get("DROPBOX_APP_SECRET")!;
    const dropboxRefreshToken = Deno.env.get("DROPBOX_REFRESH_TOKEN")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { folderPath } = await req.json();
    if (!folderPath) {
      return new Response(JSON.stringify({ error: "folderPath is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dropboxToken = await getDropboxAccessToken(dropboxAppKey, dropboxAppSecret, dropboxRefreshToken);
    const rootNamespaceId = await getRootNamespaceId(dropboxToken);
    console.log(`Root namespace ID: ${rootNamespaceId ?? "none (personal account)"}`);

    // Verify folder exists
    const metaRes = await fetch("https://api.dropboxapi.com/2/files/get_metadata", {
      method: "POST",
      headers: buildDropboxHeaders(dropboxToken, rootNamespaceId),
      body: JSON.stringify({ path: folderPath }),
    });
    const metaData = await metaRes.json();
    if (metaData.error) {
      throw new Error(`Ordner nicht gefunden oder kein Zugriff: ${JSON.stringify(metaData)}`);
    }
    console.log(`Ordner gefunden: ${folderPath}`);

    const genAI = new GoogleGenerativeAI(geminiApiKey);

    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];
    let cursor: string | null = null;
    let hasMore = true;
    let total = 0;

    // Process entries page-by-page — never accumulate all entries in memory at once
    while (hasMore) {
      const url = cursor
        ? "https://api.dropboxapi.com/2/files/list_folder/continue"
        : "https://api.dropboxapi.com/2/files/list_folder";

      const body = cursor
        ? { cursor }
        : { path: folderPath, recursive: true, include_media_info: false };

      const res = await fetch(url, {
        method: "POST",
        headers: buildDropboxHeaders(dropboxToken, rootNamespaceId),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Dropbox list_folder failed: ${err}`);
      }

      const page: DropboxListResult = await res.json();
      if ((page as any).error) {
        throw new Error(`Dropbox list_folder error: ${JSON.stringify((page as any).error)}`);
      }

      // Process each image on this page immediately, then discard
      for (const entry of page.entries) {
        if (entry[".tag"] !== "file" || !/\.(jpe?g|png|webp|heic|tiff?)$/i.test(entry.name)) {
          continue;
        }
        total++;
        try {
          await processEntry(entry, dropboxToken, rootNamespaceId, genAI, supabase);
          processed++;
          console.log(`[${processed}] OK: ${entry.name}`);
        } catch (err) {
          errors.push(`${entry.name}: ${err instanceof Error ? err.message : String(err)}`);
          skipped++;
          console.error(`[skip] ${entry.name}:`, err);
        }
      }

      hasMore = page.has_more;
      cursor = page.cursor;
    }

    return new Response(
      JSON.stringify({
        success: true,
        total,
        processed,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
