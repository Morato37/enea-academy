import { supabase } from '../supabase';
import type { MoodboardImage } from './types';
import {
  commonNameFolderPattern,
  detectSeasons,
  genusFolderPattern,
  imageRelevance,
  matchImageToPlant,
  moodboardTags,
  parsePlantName,
  seasonalityGenusPattern,
  speciesPathPattern,
  type PlantName,
} from './imageSignals';

/**
 * Loads moodboard pictures from the image search (table dropbox_images_index).
 *
 * Pictures are found by four read-only queries per plant: species name in the Dropbox path,
 * exact botanical-name tag, the "Plants Seasonality/<English name>" folder, and, only when
 * a plant has too few pictures, the genus folder. matchImageToPlant() then decides per row
 * whether it really belongs to the plant and how good it is; curated folders win over AI tags.
 */

/** Below this many pictures per plant we also look at pictures that only name the genus. */
const MIN_IMAGES_BEFORE_GENUS_FALLBACK = 5;
const PAGE_SIZE = 1000;
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

/** Either a path pattern (ILIKE) or an exact tag. */
type RowFilter = { pathLike: string } | { tag: string };

/** Runs a query page by page (Supabase returns at most 1000 rows per request). */
async function fetchAll(filter: RowFilter): Promise<DropboxImageRow[]> {
  const rows: DropboxImageRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase.from('dropbox_images_index').select(COLUMNS);
    query = 'tag' in filter ? query.contains('tags', [filter.tag]) : query.ilike('dropbox_path', filter.pathLike);
    const { data, error } = await query.order('id').range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...((data || []) as DropboxImageRow[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

async function candidateRows(name: PlantName, commonNameEn: string | null): Promise<DropboxImageRow[]> {
  const queries: Promise<DropboxImageRow[]>[] = [];
  const pathPattern = speciesPathPattern(name);
  if (pathPattern) queries.push(fetchAll({ pathLike: pathPattern }));
  for (const alias of name.tagAliases) queries.push(fetchAll({ tag: alias }));
  const seasonalityPattern = seasonalityGenusPattern(name);
  queries.push(fetchAll({ pathLike: seasonalityPattern }));
  if (commonNameEn?.trim()) {
    const pattern = commonNameFolderPattern(commonNameEn);
    queries.push(fetchAll({ pathLike: pattern }));
  }
  return (await Promise.all(queries)).flat();
}

function toImages(rows: DropboxImageRow[], plantId: string, name: PlantName, commonNameEn: string | null, seen: Set<string>): MoodboardImage[] {
  const images: MoodboardImage[] = [];
  for (const row of rows) {
    const id = String(row.id);
    if (seen.has(id)) continue;
    const url = imageUrl(row);
    if (!url) continue;
    const tags = readTags(row.tags);
    const match = matchImageToPlant(row.dropbox_path, tags, name, commonNameEn);
    if (!match) continue;
    seen.add(id);
    const seasons = detectSeasons(row.dropbox_path, tags);
    images.push({
      id,
      url,
      plantId,
      tags: moodboardTags(tags, seasons),
      width: null,
      height: null,
      relevance: imageRelevance(match, seasons),
      matchSource: match.source,
      seasonCertain: seasons.certain,
      path: row.dropbox_path,
    });
  }
  return images;
}

async function imagesForPlant(plant: PlantRow): Promise<MoodboardImage[]> {
  if (!plant.botanical_name?.trim()) return [];
  const plantId = String(plant.id);
  const name = parsePlantName(plant.botanical_name);
  const seen = new Set<string>();
  const images = toImages(await candidateRows(name, plant.common_name_en), plantId, name, plant.common_name_en, seen);

  if (images.length < MIN_IMAGES_BEFORE_GENUS_FALLBACK) {
    const pattern = genusFolderPattern(name);
    const genusRows = await fetchAll({ pathLike: pattern });
    images.push(...toImages(genusRows, plantId, name, plant.common_name_en, seen));
  }
  return images.sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));
}

export async function loadMoodboardImages(plantIds: (string | number)[]): Promise<MoodboardImage[]> {
  const ids = [...new Set(plantIds.map(String))];
  if (!ids.length) return [];

  const { data: plants, error } = await supabase
    .from('plants_flat')
    .select('id, botanical_name, common_name_en')
    .in('id', ids);
  if (error) throw error;

  const perPlant = await Promise.all(((plants || []) as PlantRow[]).map(imagesForPlant));
  // A picture may match two plants of the selection (e.g. a planting scene); it stays with the
  // plant it fits best so the same picture never appears twice.
  const best = new Map<string, MoodboardImage>();
  for (const image of perPlant.flat()) {
    const current = best.get(image.id);
    if (!current || (image.relevance ?? 0) > (current.relevance ?? 0)) best.set(image.id, image);
  }
  return [...best.values()].sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));
}
