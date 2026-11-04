import { supabase } from './supabase';

export interface LibraryCsvRow {
  id: string;
  item_type: string;
  title: string;
  creators: string;
  first_name: string;
  last_name: string;
  collection: string;
  ean_isbn13: string;
  upc_isbn10: string;
  description: string;
  publisher: string;
  publish_date: string;
  group: string;
  tags: string;
  notes: string;
  price: string;
  length: string;
  call_number: string;
  ddc: string;
  lcc: string;
  lccn: string;
  oclc: string;
  rating: string;
  status: string;
  added: string;
  copies: string;
}

export interface ImportProgress {
  phase: 'idle' | 'parsing' | 'checking' | 'inserting' | 'done' | 'error';
  total: number;
  processed: number;
  inserted: number;
  skipped: number;
  message: string;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  values.push(current);
  return values;
}

function parseCsv(text: string): LibraryCsvRow[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '\n' && !inQuotes) {
      lines.push(current.replace(/\r$/, ''));
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: LibraryCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row as unknown as LibraryCsvRow);
  }

  return rows;
}

function buildAuthor(row: LibraryCsvRow): string {
  const creators = row.creators?.trim();
  if (creators) return creators;
  const fn = row.first_name?.trim();
  const ln = row.last_name?.trim();
  const combined = [fn, ln].filter(Boolean).join(' ').trim();
  return combined || 'Unknown';
}

function buildDescription(row: LibraryCsvRow): string | null {
  const parts: string[] = [];
  const desc = row.description?.trim();
  if (desc) parts.push(desc);

  const meta: string[] = [];
  if (row.publisher?.trim()) meta.push(`Publisher: ${row.publisher.trim()}`);
  if (row.publish_date?.trim()) meta.push(`Published: ${row.publish_date.trim()}`);
  if (row.tags?.trim()) meta.push(`Tags: ${row.tags.trim()}`);
  if (row.notes?.trim()) meta.push(`Notes: ${row.notes.trim()}`);
  if (row.length?.trim()) meta.push(`Pages: ${row.length.trim()}`);
  if (row.ddc?.trim()) meta.push(`DDC: ${row.ddc.trim()}`);
  if (row.lcc?.trim()) meta.push(`LCC: ${row.lcc.trim()}`);
  if (row.lccn?.trim()) meta.push(`LCCN: ${row.lccn.trim()}`);
  if (row.oclc?.trim()) meta.push(`OCLC: ${row.oclc.trim()}`);
  if (row.rating?.trim()) meta.push(`Rating: ${row.rating.trim()}`);
  if (row.copies?.trim() && row.copies.trim() !== '1') meta.push(`Copies: ${row.copies.trim()}`);

  if (meta.length > 0) {
    parts.push(meta.join(' | '));
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

const MIN_BYTES = 2000;

function isbn13to10(isbn: string): string | null {
  if (isbn.length !== 13 || !isbn.startsWith('978')) return null;
  const core = isbn.slice(3, 12);
  const sum = [...core].reduce((s, d, k) => s + (10 - k) * +d, 0);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? 'X' : check);
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') ?? '';
    if (!ct.startsWith('image/')) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    return buf.byteLength >= MIN_BYTES ? buf : null;
  } catch {
    return null;
  }
}

async function tryOpenLibraryCoverId(isbn: string): Promise<string | null> {
  try {
    const r = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const data = await r.json();
    const coverId = data.covers?.find((c: number) => c > 0) ?? data.cover;
    if (!coverId) return null;
    const url = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    const img = await fetchImageBytes(url);
    return img ? url : null;
  } catch {
    return null;
  }
}

async function tryGoogleBooks(isbn: string): Promise<string | null> {
  try {
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const data = await r.json();
    const links = data.items?.[0]?.volumeInfo?.imageLinks;
    const url = links?.extraLarge ?? links?.large ?? links?.medium ?? links?.thumbnail ?? links?.smallThumbnail;
    if (!url) return null;
    const httpsUrl = url.replace('http://', 'https://').replace('&edge=curl', '');
    const img = await fetchImageBytes(httpsUrl);
    return img ? httpsUrl : null;
  } catch {
    return null;
  }
}

async function tryDnb(isbn: string): Promise<string | null> {
  const url = `https://portal.dnb.de/opac/mvb/cover?isbn=${isbn}`;
  const img = await fetchImageBytes(url);
  return img ? url : null;
}

async function tryAmazon(isbn: string): Promise<string | null> {
  const i10 = isbn13to10(isbn);
  if (!i10) return null;
  const url = `https://images-na.ssl-images-amazon.com/images/P/${i10}.01.LZZZZZZZ.jpg`;
  const img = await fetchImageBytes(url);
  return img ? url : null;
}

async function findCoverUrl(rawIsbn: string): Promise<string | null> {
  const clean = rawIsbn.replace(/[^0-9X]/gi, '');
  if (clean.length < 10) return null;
  const sources = [tryOpenLibraryCoverId, tryGoogleBooks, tryDnb, tryAmazon];
  for (const src of sources) {
    const url = await src(clean).catch(() => null);
    if (url) return url;
  }
  return null;
}

export async function updateBookCovers(
  onProgress: (p: ImportProgress) => void
): Promise<void> {
  onProgress({
    phase: 'checking',
    total: 0,
    processed: 0,
    inserted: 0,
    skipped: 0,
    message: 'Finding books with ISBN and outdated or missing covers...',
  });

  const { data: books, error } = await supabase
    .from('library_books')
    .select('id, isbn, cover_image_url')
    .not('isbn', 'is', null);

  if (error) throw error;

  const needsCover = (books || []).filter(b => b.isbn && b.isbn.trim());

  onProgress({
    phase: 'inserting',
    total: needsCover.length,
    processed: 0,
    inserted: 0,
    skipped: 0,
    message: `Looking up covers for ${needsCover.length} books via multiple sources...`
  });

  let updated = 0;
  let notFound = 0;
  const CONCURRENCY = 3;

  for (let i = 0; i < needsCover.length; i += CONCURRENCY) {
    const batch = needsCover.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (book) => {
        const coverUrl = await findCoverUrl(book.isbn);
        if (coverUrl) {
          const { error: updateError } = await supabase
            .from('library_books')
            .update({ cover_image_url: coverUrl })
            .eq('id', book.id);
          if (updateError) throw updateError;
          return true;
        }
        return false;
      })
    );

    const found = results.filter(Boolean).length;
    updated += found;
    notFound += results.length - found;
    onProgress({
      phase: 'inserting',
      total: needsCover.length,
      processed: i + batch.length,
      inserted: updated,
      skipped: notFound,
      message: `Processed ${i + batch.length} of ${needsCover.length} — ${updated} covers found, ${notFound} not found`,
    });
  }

  onProgress({
    phase: 'done',
    total: needsCover.length,
    processed: needsCover.length,
    inserted: updated,
    skipped: notFound,
    message: `Cover update complete: ${updated} covers found, ${notFound} books have no cover available.`,
  });
}

export async function importLibraryFromCsv(
  csvUrl: string,
  onProgress: (p: ImportProgress) => void
): Promise<void> {
  onProgress({ phase: 'parsing', total: 0, processed: 0, inserted: 0, skipped: 0, message: 'Fetching CSV file...' });

  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);
  const text = await response.text();

  onProgress({ phase: 'parsing', total: 0, processed: 0, inserted: 0, skipped: 0, message: 'Parsing CSV rows...' });
  const rows = parseCsv(text);

  onProgress({
    phase: 'checking',
    total: rows.length,
    processed: 0,
    inserted: 0,
    skipped: 0,
    message: `Checking ${rows.length} books against existing catalog...`,
  });

  const { data: existing } = await supabase
    .from('library_books')
    .select('title, author');
  const existingKeys = new Set(
    (existing || []).map(b => `${(b.title || '').toLowerCase().trim()}|${(b.author || '').toLowerCase().trim()}`)
  );

  let skipped = 0;
  const batchRows: Array<{ title: string; author: string; isbn: string | null; description: string | null; category: string; cover_image_url: string | null }> = [];

  for (const row of rows) {
    const title = row.title?.trim() || 'Untitled';
    const author = buildAuthor(row);
    const key = `${title.toLowerCase()}|${author.toLowerCase()}`;
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }
    const isbn = row.ean_isbn13?.trim() || row.upc_isbn10?.trim() || null;
    const description = buildDescription(row);
    const category = row.group?.trim() || 'General';
    batchRows.push({ title, author, isbn, description, category, cover_image_url: null });
  }

  onProgress({
    phase: 'inserting',
    total: rows.length,
    processed: 0,
    inserted: 0,
    skipped,
    message: `Inserting ${batchRows.length} new books in batches...`,
  });

  let inserted = 0;
  const BATCH_SIZE = 25;
  for (let i = 0; i < batchRows.length; i += BATCH_SIZE) {
    const batch = batchRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('library_books').insert(batch);
    if (error) throw error;
    inserted += batch.length;
    onProgress({
      phase: 'inserting',
      total: rows.length,
      processed: i + batch.length,
      inserted,
      skipped,
      message: `Inserted ${inserted} of ${batchRows.length} books...`,
    });
  }

  onProgress({
    phase: 'done',
    total: rows.length,
    processed: rows.length,
    inserted,
    skipped,
    message: `Import complete: ${inserted} books added, ${skipped} already existed.`,
  });
}
