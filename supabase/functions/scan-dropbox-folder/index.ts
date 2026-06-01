import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DropboxListResult {
  entries: Array<{ ".tag": string; path_lower: string; name: string }>;
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
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`Dropbox token refresh failed: ${await res.text()}`);
  return (await res.json()).access_token as string;
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
    headers["Dropbox-API-Path-Root"] = JSON.stringify({ ".tag": "root", root: rootNamespaceId });
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

async function tagImageWithGeminiRest(base64: string, mimeType: string, apiKey: string): Promise<string[]> {
  const modelName = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{
      parts: [
        { text: "Analysiere dieses Bild. Antworte NUR mit einer kommagetrennten Liste von 10 passenden Schlagwörtern (Materialien, Pflanzen, Stimmung, Farbe). Keine Einleitung." },
        { inlineData: { mimeType, data: base64 } },
      ],
    }],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Gemini API Error: ${JSON.stringify(data)}`);
  }

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("Gemini hat keine Antwort generiert.");
  }

  const textResponse: string = data.candidates[0].content.parts[0].text;
  return textResponse.trim().split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
}

// ── action: list_files ──────────────────────────────────────────────────────
async function handleListFiles(
  folderPath: string,
  dropboxToken: string,
  rootNamespaceId: string | null,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const allPaths: string[] = [];
  let cursor: string | null = null;
  let hasMore = true;

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
    if (!res.ok) throw new Error(`list_folder failed: ${await res.text()}`);

    const page: DropboxListResult = await res.json();
    if ((page as any).error) throw new Error(`list_folder error: ${JSON.stringify((page as any).error)}`);

    for (const entry of page.entries) {
      if (entry[".tag"] === "file" && /\.(jpe?g|png|webp|heic|tiff?)$/i.test(entry.name)) {
        allPaths.push(entry.path_lower);
      }
    }
    hasMore = page.has_more;
    cursor = page.cursor;
  }

  // Fetch already-scanned paths that have tags from the DB
  const { data: existing } = await supabase
    .from("dropbox_images_index")
    .select("dropbox_path, tags")
    .in("dropbox_path", allPaths);

  const alreadyTaggedPaths = new Set(
    (existing ?? [])
      .filter((row) => Array.isArray(row.tags) && row.tags.length > 0)
      .map((row) => row.dropbox_path as string)
  );

  const paths = allPaths.filter((p) => !alreadyTaggedPaths.has(p));
  const skippedCount = allPaths.length - paths.length;

  return new Response(
    JSON.stringify({ success: true, paths, totalFound: allPaths.length, skippedCount }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ── action: process_single_image ────────────────────────────────────────────
async function handleProcessSingleImage(
  imagePath: string,
  dropboxToken: string,
  rootNamespaceId: string | null,
  geminiApiKey: string,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  // 1. Download image — cap at 4 MB
  const dlHeaders: Record<string, string> = {
    Authorization: `Bearer ${dropboxToken}`,
    "Dropbox-API-Arg": JSON.stringify({ path: imagePath }),
  };
  if (rootNamespaceId) {
    dlHeaders["Dropbox-API-Path-Root"] = JSON.stringify({ ".tag": "root", root: rootNamespaceId });
  }

  const dlRes = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: dlHeaders,
  });
  if (!dlRes.ok) throw new Error(`Download failed for ${imagePath}: ${dlRes.status}`);

  const reader = dlRes.body!.getReader();
  const chunks: Uint8Array[] = [];
  let totalLen = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLen += value.length;
    if (totalLen > 4 * 1024 * 1024) break;
  }
  reader.cancel();

  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }

  // 2. Base64-encode
  let binary = "";
  for (let i = 0; i < merged.length; i++) binary += String.fromCharCode(merged[i]);
  const base64 = btoa(binary);

  const ext = imagePath.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  // 3. Tag via Gemini REST
  const tags = await tagImageWithGeminiRest(base64, mimeType, geminiApiKey);

  // 4. Shared link for preview
  const sharedLink = await getOrCreateSharedLink(dropboxToken, imagePath, rootNamespaceId);

  // 5. Persist to DB
  const { error: dbError } = await supabase
    .from("dropbox_images_index")
    .upsert(
      {
        dropbox_path: imagePath,
        tags,
        dropbox_shared_link: sharedLink,
        last_scanned_at: new Date().toISOString(),
        status: "scanned",
      },
      { onConflict: "dropbox_path" }
    );
  if (dbError) throw new Error(dbError.message);

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ── Main handler ─────────────────────────────────────────────────────────────

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

    // Auth guard
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await supabase
      .from("user_profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, folderPath, imagePath } = body;

    const dropboxToken = await getDropboxAccessToken(dropboxAppKey, dropboxAppSecret, dropboxRefreshToken);
    const rootNamespaceId = await getRootNamespaceId(dropboxToken);

    if (action === "list_files") {
      if (!folderPath) {
        return new Response(JSON.stringify({ error: "folderPath is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return await handleListFiles(folderPath, dropboxToken, rootNamespaceId, supabase);
    }

    if (action === "process_single_image") {
      if (!imagePath) {
        return new Response(JSON.stringify({ error: "imagePath is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return await handleProcessSingleImage(imagePath, dropboxToken, rootNamespaceId, geminiApiKey, supabase);
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
