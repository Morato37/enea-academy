import { supabase } from '../supabase';
import type { MoodboardImage } from './types';
import {
  detectSeasons,
  imageRelevance,
  matchImageToPlant,
  moodboardTags,
  parsePlantName,
  type PlantName,
} from './imageSignals';

/**
 * Loads moodboard pictures from the image search (table dropbox_images_index), read-only.
 *
 * For the whole selection at once (so large selections need only a handful of requests):
 *  1. rows whose Dropbox path contains a species name, a "_SEASONALITY/<Season>/<Genus>/" folder
 *     or a "Plants Seasonality/<English name>/" folder,
 *  2. rows with an exact botanical-name tag,
 *  3. only for plants that still have fewer than 5 pictures: rows in their genus folder.
 * matchImageToPlant() then decides per row and plant whether it belongs to the plant and how good
 * it is; curated folders win over AI tags.
 *
 * A picture can belong to several plants of the selection (e.g. a genus picture for three maples).
 * It is listed once per plant; the moodboard never places the same picture twice.
 */

const MIN_IMAGES_BEFORE_GENUS_FALLBACK = 5;
const PAGE_SIZE = 1000;
/** Patterns per request; keeps the URL short. */
const PATTERNS_PER_REQUEST = 12;
const TAGS_PER_REQUEST = 60;
/** Parallel single requests when a combined request is rejected. */
const FALLBACK_CONCURRENCY = 6;
const COLUMNS = 'id, dropbox_path, dropbox_shared_link, tags';

type PlantRow = {
  id: number;
  botanical_name: string | null;
  common_name_en: string | null;
};

type DropboxImageRow = {
  id: string;
  dropbox_path: string;
  dropbox_shared_link: string | null;
  tags: string[] | string | null;
};

interface Plant {
  id: string;
  name: PlantName;
  commonNameEn: string | null;
}

function readTags(value: string[] | string | null): string[] {
  if (Array.isArray(value)) return value.filter((tag): tag is string => typeof tag === 'string');
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((tag): tag is string => typeof tag === 'string');
  } catch {
    return value.replace(/^\{|\}$/g, '').split(',').map(tag => tag.replace(/^"|"$/g, '').trim()).filter(Boolean);
  }
  return [value];
}

/** Dropbox shared link as a direct image URL. Rows without a link cannot be shown and are skipped. */
function imageUrl(row: DropboxImageRow): string | null {
  const link = row.dropbox_shared_link;
  if (!link || !/^https?:\/\//i.test(link)) return null;
  if (!link.includes('dropbox.com')) return link;
  const url = new URL(link);
  url.searchParams.delete('dl');
  url.searchParams.set('raw', '1');
  return url.toString();
}

const chunk = <T,>(list: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

/**
 * ILIKE pattern for PostgREST's or=() filter. Only letters, digits and spaces are kept (everything
 * else becomes the "_" single-character wildcard), so no quoting problems; matchImageToPlant()
 * checks every row exactly afterwards.
 */
function likeValue(...parts: string[]): string {
  return `%${parts.map(p => p.replace(/[^\p{L}\p{N} ]/gu, '_')).join('%')}%`;
}

type RowFilter =
  | { kind: 'paths'; patterns: string[] }  // several ILIKE patterns in one or=() request
  | { kind: 'path'; pattern: string }      // one ILIKE pattern
  | { kind: 'tags'; tags: string[] }       // tags overlap the list
  | { kind: 'tag'; tag: string };          // tags contain this tag

/** Problems of the last loadMoodboardImages() call (failed requests that were skipped). */
let lastIssues: string[] = [];
export function lastMoodboardLoadIssues(): string[] {
  return [...lastIssues];
}

/** Readable text for Supabase/PostgREST errors (they are plain objects, not Error instances). */
export function describeError(error: unknown): string {
  if (!error) return 'Unbekannter Fehler';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object') {
    const e = error as { message?: string; details?: string; hint?: string; code?: string };
    return [e.code, e.message, e.details, e.hint].filter(Boolean).join(' – ') || JSON.stringify(error);
  }
  return String(error);
}

function applyFilter(filter: RowFilter) {
  const query = supabase.from('dropbox_images_index').select(COLUMNS);
  switch (filter.kind) {
    // Values in double quotes, so spaces and other characters cannot break the or=() syntax.
    case 'paths': return query.or(filter.patterns.map(p => `dropbox_path.ilike."${p}"`).join(','));
    case 'path': return query.ilike('dropbox_path', filter.pattern);
    case 'tags': return query.overlaps('tags', `{${filter.tags.map(t => `"${t.replace(/["\\]/g, '')}"`).join(',')}}`);
    case 'tag': return query.contains('tags', [filter.tag]);
  }
}

/** Runs one filtered request page by page (Supabase returns at most 1000 rows per request). */
async function fetchAll(filter: RowFilter): Promise<DropboxImageRow[]> {
  const rows: DropboxImageRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await applyFilter(filter).order('id').range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...((data || []) as DropboxImageRow[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/** Runs tasks with at most `limit` requests at the same time. */
async function inBatches<T, R>(items: T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) results.push(...await Promise.all(items.slice(i, i + limit).map(run)));
  return results;
}

/** Single requests as fallback: a failing one is skipped and reported, the rest still count. */
async function fetchEach(filters: RowFilter[]): Promise<DropboxImageRow[]> {
  const results = await inBatches(filters, FALLBACK_CONCURRENCY, async filter => {
    try {
      return await fetchAll(filter);
    } catch (error) {
      lastIssues.push(describeError(error));
      console.warn('Moodboard: Abfrage übersprungen', filter, error);
      return [];
    }
  });
  return results.flat();
}

/** Combined request first; if the server rejects it, the same patterns one by one. */
async function fetchCombined(combined: RowFilter, single: RowFilter[]): Promise<DropboxImageRow[]> {
  try {
    return await fetchAll(combined);
  } catch (error) {
    console.warn('Moodboard: Sammelabfrage abgelehnt, frage einzeln ab', describeError(error));
    return fetchEach(single);
  }
}

async function rowsForPathPatterns(patterns: string[]): Promise<DropboxImageRow[]> {
  const groups = chunk([...new Set(patterns)], PATTERNS_PER_REQUEST);
  const results = await Promise.all(groups.map(group =>
    fetchCombined({ kind: 'paths', patterns: group }, group.map(pattern => ({ kind: 'path', pattern }) as RowFilter))));
  return results.flat();
}

async function rowsForTags(tags: string[]): Promise<DropboxImageRow[]> {
  const groups = chunk([...new Set(tags)], TAGS_PER_REQUEST);
  const results = await Promise.all(groups.map(group =>
    fetchCombined({ kind: 'tags', tags: group }, group.map(tag => ({ kind: 'tag', tag }) as RowFilter))));
  return results.flat();
}

function addMatches(rows: DropboxImageRow[], plants: Plant[], byPlant: Map<string, Map<string, MoodboardImage>>) {
  for (const row of rows) {
    const url = imageUrl(row);
    if (!url) continue;
    const tags = readTags(row.tags);
    let seasons: ReturnType<typeof detectSeasons> | null = null;
    for (const plant of plants) {
      const own = byPlant.get(plant.id)!;
      const id = String(row.id);
      if (own.has(id)) continue;
      const match = matchImageToPlant(row.dropbox_path, tags, plant.name, plant.commonNameEn);
      if (!match) continue;
      seasons ??= detectSeasons(row.dropbox_path, tags);
      own.set(id, {
        id,
        url,
        plantId: plant.id,
        tags: moodboardTags(tags, seasons),
        width: null,
        height: null,
        relevance: imageRelevance(match, seasons),
        matchSource: match.source,
        seasonCertain: seasons.certain,
        path: row.dropbox_path,
      });
    }
  }
}

export async function loadMoodboardImages(plantIds: (string | number)[]): Promise<MoodboardImage[]> {
  lastIssues = [];
  const ids = [...new Set(plantIds.map(String))];
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('plants_flat')
    .select('id, botanical_name, common_name_en')
    .in('id', ids);
  if (error) throw error;

  const plants: Plant[] = ((data || []) as PlantRow[])
    .filter(p => p.botanical_name?.trim())
    .map(p => ({ id: String(p.id), name: parsePlantName(p.botanical_name!), commonNameEn: p.common_name_en?.trim() || null }));
  const byPlant = new Map(plants.map(p => [p.id, new Map<string, MoodboardImage>()]));

  // 1 + 2: species names, curated season folders and tags for the whole selection
  const patterns = plants.flatMap(p => [
    ...(p.name.speciesWords.length ? [likeValue(...p.name.speciesWords)] : []),
    likeValue('/plants/_seasonality/', `/${p.name.genus}/`),
    ...(p.commonNameEn ? [likeValue('/plants seasonality/', `${p.commonNameEn.toLowerCase()}/`)] : []),
  ]);
  const [pathRows, tagRows] = await Promise.all([
    rowsForPathPatterns(patterns),
    rowsForTags(plants.flatMap(p => p.name.tagAliases)),
  ]);
  addMatches([...pathRows, ...tagRows], plants, byPlant);

  // 3: genus folder only for plants that are still short of pictures
  const short = plants.filter(p => [...byPlant.get(p.id)!.values()].filter(i => i.matchSource !== 'gattung').length < MIN_IMAGES_BEFORE_GENUS_FALLBACK);
  if (short.length) {
    const genusRows = await rowsForPathPatterns(short.map(p => likeValue('/plants/', `/${p.name.genus}/`)));
    addMatches(genusRows, short, byPlant);
  }

  return [...byPlant.values()]
    .flatMap(images => [...images.values()])
    .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));
}
