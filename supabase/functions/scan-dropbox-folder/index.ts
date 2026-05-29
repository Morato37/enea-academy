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

async function listDropboxFolder(token: string, folderPath: string): Promise<DropboxEntry[]> {
  const entries: DropboxEntry[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const url = cursor
      ? "https://api.dropboxapi.com/2/files/list_folder/continue"
      : "https://api.dropboxapi.com/2/files/list_folder";

    const body = cursor ? { cursor } : { path: folderPath, recursive: false };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Dropbox list_folder failed: ${err}`);
    }

    const data: DropboxListResult = await res.json();
    for (const entry of data.entries) {
      if (entry[".tag"] === "file" && /\.(jpe?g|png|webp|heic|tiff?)$/i.test(entry.name)) {
        entries.push(entry);
      }
    }
    hasMore = data.has_more;
    cursor = data.cursor;
  }

  return entries;
}

async function getOrCreateSharedLink(token: string, path: string): Promise<string | null> {
  // Try creating; if already exists, retrieve existing
  const res = await fetch("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  const data = await res.json();
  if (data.url) return data.url.replace("dl=0", "raw=1");
  // Already exists — fetch existing
  if (data.error_summary?.startsWith("shared_link_already_exists")) {
    const existing = data.error?.["shared_link_already_exists"]?.metadata?.url;
    return existing ? existing.replace("dl=0", "raw=1") : null;
  }
  return null;
}

async function tagImageWithGemini(genAI: GoogleGenerativeAI, imageBuffer: ArrayBuffer, mimeType: string): Promise<string[]> {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;
    const dropboxToken = Deno.env.get("DROPBOX_ACCESS_TOKEN")!;

    // Authenticate calling user and verify admin role
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

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const entries = await listDropboxFolder(dropboxToken, folderPath);

    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        // Download image
        const dlRes = await fetch("https://content.dropboxapi.com/2/files/download", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${dropboxToken}`,
            "Dropbox-API-Arg": JSON.stringify({ path: entry.path_lower }),
          },
        });

        if (!dlRes.ok) {
          errors.push(`${entry.name}: download failed`);
          continue;
        }

        const imageBuffer = await dlRes.arrayBuffer();
        const ext = entry.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

        // Tag with Gemini
        const tags = await tagImageWithGemini(genAI, imageBuffer, mimeType);

        // Get/create shared link
        const sharedLink = await getOrCreateSharedLink(dropboxToken, entry.path_lower);

        // Upsert into DB
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

        processed++;
      } catch (err) {
        errors.push(`${entry.name}: ${err instanceof Error ? err.message : String(err)}`);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: entries.length,
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
