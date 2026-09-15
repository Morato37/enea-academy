import { UserSelection } from '../supabase';
import { ProjectHandover, ProjectTreeInput } from './types';

const KEY = 'tree-benefits-handover';

/** Route of the tree benefits page. */
export const TREE_BENEFITS_PATH = '/tree-benefits';

/**
 * Build the handover payload from a project selection: only trees and palms, grouped by plant,
 * quantities summed, default size class "medium".
 */
export function buildHandover(selections: UserSelection[], projectName?: string, zoneName?: string): ProjectHandover {
  const byPlant = new Map<number, ProjectTreeInput>();
  for (const s of selections) {
    const p = s.plant;
    if (!s.plant_id || !p) continue;
    if (!(p.category_tree || p.category_palm)) continue;
    const existing = byPlant.get(s.plant_id);
    if (existing) { existing.quantity += s.quantity || 1; continue; }
    byPlant.set(s.plant_id, {
      key: `p${s.plant_id}`,
      plantId: s.plant_id,
      species: p.botanical_name,
      commonName: p.common_name_de || p.common_name_en || undefined,
      quantity: s.quantity || 1,
      evergreen: p.characteristic_evergreen ? true : p.characteristic_deciduous ? false : undefined,
      sizeClass: 'medium',
    });
  }
  return { projectName, zoneName, trees: [...byPlant.values()].sort((a, b) => a.species.localeCompare(b.species)) };
}

/** Count of trees/palms in a selection list (for enabling the handover button). */
export function countTreeSelections(selections: UserSelection[]): number {
  return selections.filter(s => s.plant && (s.plant.category_tree || s.plant.category_palm)).length;
}

export function saveHandover(h: ProjectHandover): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(h)); } catch { /* ignore */ }
}

export function loadHandover(): ProjectHandover | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const h = JSON.parse(raw);
    if (!h || !Array.isArray(h.trees)) return null;
    return h as ProjectHandover;
  } catch {
    return null;
  }
}
