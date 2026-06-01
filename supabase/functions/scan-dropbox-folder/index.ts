import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ── Dropbox auth ──────────────────────────────────────────────────────────────

async function getDropboxAccessToken(appKey: string, appSecret: string, refreshToken: string): Promise<string> {
  const credentials = btoa(`${appKey}:${appSecret}`);
  const res = await fetch("https://api.dropbox.com/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
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

async function getOrCreateSharedLink(token: string, path: string, rootNamespaceId: string | null): Promise<string | null> {
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

// ── List all files in a folder ─────────────────────────────────────────────

interface DropboxEntry {
  ".tag": string;
  path_lower: string;
  name: string;
  property_groups?: Array<{ template_id: string; fields: Array<{ name: string; value: string }> }>;
}

async function listAllFiles(
  folderPath: string,
  token: string,
  rootNamespaceId: string | null,
  includeProperties = false
): Promise<DropboxEntry[]> {
  const allEntries: DropboxEntry[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const url = cursor
      ? "https://api.dropboxapi.com/2/files/list_folder/continue"
      : "https://api.dropboxapi.com/2/files/list_folder";
    const body = cursor
      ? { cursor }
      : {
          path: folderPath,
          recursive: true,
          include_media_info: false,
          include_property_groups: includeProperties
            ? { ".tag": "filter_some", filter_some: [] }  // all templates
            : undefined,
        };

    const res = await fetch(url, {
      method: "POST",
      headers: buildDropboxHeaders(token, rootNamespaceId),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`list_folder failed: ${await res.text()}`);
    const page = await res.json();
    if (page.error) throw new Error(`list_folder error: ${JSON.stringify(page.error)}`);

    for (const entry of page.entries) {
      if (entry[".tag"] === "file" && /\.(jpe?g|png|webp|heic|tiff?)$/i.test(entry.name)) {
        allEntries.push(entry);
      }
    }
    hasMore = page.has_more;
    cursor = page.cursor;
  }

  return allEntries;
}

// ── Check which paths are already in DB (chunked to avoid query limits) ──────

async function getAlreadyIndexedPaths(
  paths: string[],
  supabase: ReturnType<typeof createClient>
): Promise<Set<string>> {
  const CHUNK = 200;
  const result = new Set<string>();
  for (let i = 0; i < paths.length; i += CHUNK) {
    const chunk = paths.slice(i, i + CHUNK);
    const { data } = await supabase
      .from("dropbox_images_index")
      .select("dropbox_path")
      .in("dropbox_path", chunk)
      .not("tags", "is", null)
      .gt("array_length(tags, 1)", 0);
    for (const row of data ?? []) result.add(row.dropbox_path);
  }
  return result;
}

// ── action: list_files ────────────────────────────────────────────────────────

async function handleListFiles(
  folderPath: string,
  token: string,
  rootNamespaceId: string | null,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const entries = await listAllFiles(folderPath, token, rootNamespaceId, false);
  const allPaths = entries.map((e) => e.path_lower);

  const alreadyIndexed = await getAlreadyIndexedPaths(allPaths, supabase);
  const paths = allPaths.filter((p) => !alreadyIndexed.has(p));

  return new Response(
    JSON.stringify({ success: true, paths, totalFound: allPaths.length, skippedCount: alreadyIndexed.size }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ── action: import_dropbox_tags ───────────────────────────────────────────────
// Read tags that are already stored as Dropbox file properties — no AI needed.

async function handleImportDropboxTags(
  folderPath: string,
  token: string,
  rootNamespaceId: string | null,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  // List all files WITH property groups
  const entries = await listAllFiles(folderPath, token, rootNamespaceId, true);

  let imported = 0;
  let skipped = 0;
  let noTags = 0;
  const errors: string[] = [];

  // Process in batches of 50 to avoid overwhelming DB
  const BATCH = 50;
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);

    const upsertRows: Array<{
      dropbox_path: string;
      tags: string[];
      dropbox_shared_link: string | null;
      last_scanned_at: string;
      status: string;
    }> = [];

    for (const entry of batch) {
      // Collect tags from all property groups
      const tags: string[] = [];
      if (entry.property_groups) {
        for (const group of entry.property_groups) {
          for (const field of group.fields) {
            // Each field value may be comma-separated
            const vals = field.value.split(/[,;]+/).map((v: string) => v.trim().toLowerCase()).filter(Boolean);
            tags.push(...vals);
          }
        }
      }

      if (tags.length === 0) { noTags++; continue; }

      // Get or create shared link
      try {
        const sharedLink = await getOrCreateSharedLink(token, entry.path_lower, rootNamespaceId);
        upsertRows.push({
          dropbox_path: entry.path_lower,
          tags,
          dropbox_shared_link: sharedLink,
          last_scanned_at: new Date().toISOString(),
          status: "scanned",
        });
        imported++;
      } catch (err) {
        errors.push(`${entry.name}: ${err instanceof Error ? err.message : String(err)}`);
        skipped++;
      }
    }

    if (upsertRows.length > 0) {
      const { error } = await supabase
        .from("dropbox_images_index")
        .upsert(upsertRows, { onConflict: "dropbox_path" });
      if (error) throw new Error(`DB upsert failed: ${error.message}`);
    }
  }

  return new Response(
    JSON.stringify({ success: true, imported, skipped, noTags, errors, total: entries.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ── action: process_single_image (AI tagging) ─────────────────────────────────

async function tagImageWithGeminiRest(base64: string, mimeType: string, apiKey: string): Promise<string[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: "Analysiere dieses Bild. Antworte NUR mit einer kommagetrennten Liste von 10 passenden Schlagwörtern (Materialien, Pflanzen, Stimmung, Farbe). Keine Einleitung." },
          { inlineData: { mimeType, data: base64 } },
        ],
      }],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Gemini API Error: ${JSON.stringify(data)}`);
  if (!data.candidates?.length) throw new Error("Gemini hat keine Antwort generiert.");
  const text: string = data.candidates[0].content.parts[0].text;
  return text.trim().split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
}

async function handleProcessSingleImage(
  imagePath: string,
  token: string,
  rootNamespaceId: string | null,
  geminiApiKey: string,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const dlHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
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

  let binary = "";
  for (let i = 0; i < merged.length; i++) binary += String.fromCharCode(merged[i]);
  const base64 = btoa(binary);

  const ext = imagePath.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const tags = await tagImageWithGeminiRest(base64, mimeType, geminiApiKey);
  const sharedLink = await getOrCreateSharedLink(token, imagePath, rootNamespaceId);

  const { error: dbError } = await supabase
    .from("dropbox_images_index")
    .upsert(
      { dropbox_path: imagePath, tags, dropbox_shared_link: sharedLink, last_scanned_at: new Date().toISOString(), status: "scanned" },
      { onConflict: "dropbox_path" }
    );
  if (dbError) throw new Error(dbError.message);

  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
    const dropboxAppKey = Deno.env.get("DROPBOX_APP_KEY")!;
    const dropboxAppSecret = Deno.env.get("DROPBOX_APP_SECRET")!;
    const dropboxRefreshToken = Deno.env.get("DROPBOX_REFRESH_TOKEN")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).maybeSingle();
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
      if (!folderPath) return new Response(JSON.stringify({ error: "folderPath required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return await handleListFiles(folderPath, dropboxToken, rootNamespaceId, supabase);
    }

    if (action === "import_dropbox_tags") {
      if (!folderPath) return new Response(JSON.stringify({ error: "folderPath required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return await handleImportDropboxTags(folderPath, dropboxToken, rootNamespaceId, supabase);
    }

    if (action === "process_single_image") {
      if (!imagePath) return new Response(JSON.stringify({ error: "imagePath required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
