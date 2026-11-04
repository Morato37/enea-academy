import { SizeClassKey, SizeClassStandard, ProjectTreeInput, TreeInput } from './types';
import { supabase, TreeSizeClass } from '../supabase';

export const SIZE_CLASS_KEYS: SizeClassKey[] = ['small', 'medium', 'large'];

/**
 * Default standards for the three size classes. They describe typical nursery planting stock
 * (Swiss trade sizes by stem circumference StU at 1 m) and are fully editable on the page.
 * DBH ≈ StU / π.
 */
export const DEFAULT_SIZE_CLASSES: Record<SizeClassKey, SizeClassStandard> = {
  small:  { label: 'StU 16–18', dbh: 5.5,  height: 4.0, crownWidth: 1.5, crownBase: 2.0 },
  medium: { label: 'StU 25–30', dbh: 8.8,  height: 5.5, crownWidth: 2.5, crownBase: 2.2 },
  large:  { label: 'StU 40–45', dbh: 13.5, height: 7.5, crownWidth: 3.5, crownBase: 2.4 },
};

const STORAGE_KEY = 'tree-benefits-size-classes';

export function loadSizeClasses(): Record<SizeClassKey, SizeClassStandard> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SIZE_CLASSES };
    const parsed = JSON.parse(raw);
    const out = { ...DEFAULT_SIZE_CLASSES };
    for (const k of SIZE_CLASS_KEYS) {
      const s = parsed?.[k];
      if (s && typeof s === 'object') {
        out[k] = {
          label: typeof s.label === 'string' ? s.label : DEFAULT_SIZE_CLASSES[k].label,
          dbh: Number(s.dbh) > 0 ? Number(s.dbh) : DEFAULT_SIZE_CLASSES[k].dbh,
          height: Number(s.height) > 0 ? Number(s.height) : DEFAULT_SIZE_CLASSES[k].height,
          crownWidth: Number(s.crownWidth) > 0 ? Number(s.crownWidth) : DEFAULT_SIZE_CLASSES[k].crownWidth,
          crownBase: Number(s.crownBase) >= 0 ? Number(s.crownBase) : DEFAULT_SIZE_CLASSES[k].crownBase,
        };
      }
    }
    return out;
  } catch {
    return { ...DEFAULT_SIZE_CLASSES };
  }
}

export function saveSizeClasses(classes: Record<SizeClassKey, SizeClassStandard>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(classes)); } catch { /* ignore */ }
}

/**
 * Fetch species-specific size class dimensions from the database for the given plant IDs.
 * Returns a map keyed by `plantId:sizeClass` -> SizeClassStandard.
 * Entries with all-zero values are skipped (treated as not set).
 */
export async function fetchSpeciesSizeClasses(
  plantIds: number[]
): Promise<Map<string, SizeClassStandard>> {
  const out = new Map<string, SizeClassStandard>();
  if (plantIds.length === 0) return out;
  try {
    const { data, error } = await supabase
      .from('tree_size_classes')
      .select('plant_id, size_class, label, dbh, height, crown_width, crown_base')
      .in('plant_id', plantIds);
    if (error || !data) return out;
    for (const row of data as TreeSizeClass[]) {
      if (!row.dbh && !row.height && !row.crown_width && !row.crown_base) continue;
      out.set(`${row.plant_id}:${row.size_class}`, {
        label: row.label || DEFAULT_SIZE_CLASSES[row.size_class as SizeClassKey].label,
        dbh: row.dbh,
        height: row.height,
        crownWidth: row.crown_width,
        crownBase: row.crown_base,
      });
    }
  } catch {
    // table might not exist yet — silently fall back to defaults
  }
  return out;
}

/**
 * Expand project trees (species × quantity × size class) into individual tree inputs.
 * IDs are numbered per species so they stay readable in the results table.
 * If speciesOverrides contains a matching entry, those dimensions are used instead of the generic class.
 */
export function expandProjectTrees(
  trees: ProjectTreeInput[],
  classes: Record<SizeClassKey, SizeClassStandard>,
  speciesOverrides?: Map<string, SizeClassStandard>
): TreeInput[] {
  const out: TreeInput[] = [];
  trees.forEach((t, i) => {
    let std = classes[t.sizeClass] || classes.medium;
    if (speciesOverrides && t.plantId) {
      const ov = speciesOverrides.get(`${t.plantId}:${t.sizeClass}`);
      if (ov) std = ov;
    }
    const qty = Math.max(0, Math.min(999, Math.round(t.quantity || 0)));
    for (let k = 1; k <= qty; k++) {
      out.push({
        species: t.species,
        id: qty > 1 ? `${i + 1}.${k}` : `${i + 1}`,
        dbh: std.dbh,
        height: std.height,
        top: std.height,
        base: Math.min(std.crownBase, std.height - 0.3),
        wNS: std.crownWidth,
        wEW: std.crownWidth,
        missing: 0,
        dieback: 0,
        evergreenHint: t.evergreen,
        sizeClass: t.sizeClass,
      });
    }
  });
  return out;
}
