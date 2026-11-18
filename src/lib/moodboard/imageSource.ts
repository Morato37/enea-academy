import { supabase } from '../supabase';
import type { MoodboardImage } from './types';

const IMAGE_BUCKET = 'dropbox-images';

type PlantRow = {
  id: number;
  botanical_name: string;
};

type DropboxImageRow = {
  id: string;
  dropbox_path: string;
  dropbox_shared_link: string | null;
  tags: string[] | string | null;
};

function normalizeTag(value: string): string {
  return value
    .toLocaleLowerCase('de-DE')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
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

function plantTagAliases(botanicalName: string): string[] {
  const normalized = normalizeTag(botanicalName);
  const words = normalized.split(' ');
  const baseName = words[1] === 'x' ? words.slice(0, 3).join(' ') : words.slice(0, 2).join(' ');
  return [...new Set([normalized, baseName])].filter(tag => tag.length >= 6);
}

function publicImageUrl(row: DropboxImageRow): string {
  const source = row.dropbox_shared_link || row.dropbox_path || '';
  if (!source) return '';
  if (!/^https?:\/\//i.test(source)) {
    return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(source).data.publicUrl;
  }
  if (source.includes('dropbox.com')) {
    return source.replace(/[?&]dl=0\b/, '').replace(/[?&]raw=1\b/, '') + (source.includes('?') ? '&raw=1' : '?raw=1');
  }
  return source;
}

export async function loadMoodboardImages(plantIds: (string | number)[]): Promise<MoodboardImage[]> {
  const ids = [...new Set(plantIds.map(String))];
  if (!ids.length) return [];

  const { data: plants, error: plantError } = await supabase
    .from('plants_flat')
    .select('id, botanical_name')
    .in('id', ids);
  if (plantError) throw plantError;

  const plantTags = new Map<string, string[]>();
  for (const plant of (plants || []) as PlantRow[]) {
    plantTags.set(String(plant.id), plantTagAliases(plant.botanical_name));
  }

  const rowsByPlant = await Promise.all(
    [...plantTags.entries()].flatMap(([plantId, aliases]) => aliases.map(async alias => {
      const { data, error } = await supabase
        .from('dropbox_images_index')
        .select('id, dropbox_path, dropbox_shared_link, tags')
        .contains('tags', [alias]);
      if (error) throw error;
      return { plantId, rows: (data || []) as DropboxImageRow[] };
    })),
  );

  const result: MoodboardImage[] = [];
  const seen = new Set<string>();
  for (const { plantId, rows } of rowsByPlant) {
    for (const row of rows) {
      const url = publicImageUrl(row);
      if (!url || seen.has(String(row.id))) continue;
      seen.add(String(row.id));
      result.push({
        id: String(row.id),
        url,
        plantId,
        tags: readTags(row.tags),
        width: null,
        height: null,
      });
    }
  }

  return result;
}
