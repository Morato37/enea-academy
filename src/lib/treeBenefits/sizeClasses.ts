import { SizeClassKey, SizeClassStandard, ProjectTreeInput, TreeInput } from './types';

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
 * Expand project trees (species × quantity × size class) into individual tree inputs.
 * IDs are numbered per species so they stay readable in the results table.
 */
export function expandProjectTrees(
  trees: ProjectTreeInput[],
  classes: Record<SizeClassKey, SizeClassStandard>
): TreeInput[] {
  const out: TreeInput[] = [];
  trees.forEach((t, i) => {
    const std = classes[t.sizeClass] || classes.medium;
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
