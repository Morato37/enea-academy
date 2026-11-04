import { Plant, UserSelection } from './supabase';

export type PlantCategoryKey =
  | 'tree' | 'shrub' | 'palm' | 'perennial' | 'annual'
  | 'grass' | 'succulent' | 'bulb' | 'acquatic'
  | 'fern' | 'climbing' | 'formal_hedge' | 'wild_hedge'
  | 'ground_cover' | 'culinary' | 'medicinal';

export type ShrubForm = 'wave' | 'hedge';

export interface ShrubSalesDetails {
  form: ShrubForm | '';
  linearMeters?: number;
}

export interface TreeSalesDetails {
  heightCm?: number;
}

const SHRUB_SALES_MARKER = '[shrub-sales]';
const TREE_SALES_MARKER = '[tree-sales]';

export function getShrubSalesDetails(notes?: string | null): ShrubSalesDetails {
  const line = notes?.split('\n').find(value => value.startsWith(SHRUB_SALES_MARKER));
  if (!line) return { form: '' };
  try {
    const parsed = JSON.parse(line.slice(SHRUB_SALES_MARKER.length)) as Partial<ShrubSalesDetails>;
    return {
      form: parsed.form === 'wave' || parsed.form === 'hedge' ? parsed.form : '',
      linearMeters: typeof parsed.linearMeters === 'number' ? parsed.linearMeters : undefined,
    };
  } catch {
    return { form: '' };
  }
}

export function getTreeSalesDetails(notes?: string | null): TreeSalesDetails {
  const line = notes?.split('\n').find(value => value.startsWith(TREE_SALES_MARKER));
  if (!line) return {};
  try {
    const parsed = JSON.parse(line.slice(TREE_SALES_MARKER.length)) as Partial<TreeSalesDetails>;
    return { heightCm: typeof parsed.heightCm === 'number' ? parsed.heightCm : undefined };
  } catch {
    return {};
  }
}

export function setTreeSalesDetails(
  notes: string | null | undefined,
  details: TreeSalesDetails,
): string | null {
  const remaining = (notes || '').split('\n').filter(value => !value.startsWith(TREE_SALES_MARKER)).join('\n').trim();
  if (details.heightCm === undefined) return remaining || null;
  return [remaining, `${TREE_SALES_MARKER}${JSON.stringify({ heightCm: details.heightCm })}`].filter(Boolean).join('\n');
}

export function setShrubSalesDetails(
  notes: string | null | undefined,
  details: ShrubSalesDetails,
): string | null {
  const remaining = (notes || '').split('\n').filter(value => !value.startsWith(SHRUB_SALES_MARKER)).join('\n').trim();
  const hasDetails = details.form || details.linearMeters !== undefined;
  if (!hasDetails) return remaining || null;
  const payload = JSON.stringify({
    form: details.form || undefined,
    linearMeters: details.linearMeters,
  });
  return [remaining, `${SHRUB_SALES_MARKER}${payload}`].filter(Boolean).join('\n');
}

export interface CategoryDef {
  key: PlantCategoryKey;
  labelDe: string;
  labelEn: string;
  check: (plant: Plant) => boolean;
}

export const CATEGORY_DEFS: CategoryDef[] = [
  { key: 'tree', labelDe: 'Bäume', labelEn: 'Trees', check: p => !!p.category_tree },
  { key: 'shrub', labelDe: 'Sträucher', labelEn: 'Shrubs', check: p => !!p.category_shrub },
  { key: 'palm', labelDe: 'Palmen', labelEn: 'Palms', check: p => !!p.category_palm },
  { key: 'perennial', labelDe: 'Stauden', labelEn: 'Perennials', check: p => !!p.category_perennial },
  { key: 'annual', labelDe: 'Einjährige', labelEn: 'Annuals', check: p => !!p.category_annual },
  { key: 'grass', labelDe: 'Gräser', labelEn: 'Grasses', check: p => !!p.category_grass },
  { key: 'succulent', labelDe: 'Sukkulenten', labelEn: 'Succulents', check: p => !!p.category_succulent },
  { key: 'bulb', labelDe: 'Zwiebel- und Knollenpflanzen', labelEn: 'Bulbs', check: p => !!p.category_bulb },
  { key: 'acquatic', labelDe: 'Wasserpflanzen', labelEn: 'Aquatic Plants', check: p => !!p.category_acquatic },
  { key: 'fern', labelDe: 'Farne', labelEn: 'Ferns', check: p => !!p.category_fern },
  { key: 'climbing', labelDe: 'Kletterpflanzen', labelEn: 'Climbing Plants', check: p => !!p.category_climbing_plant },
  { key: 'formal_hedge', labelDe: 'Formhecken', labelEn: 'Formal Hedges', check: p => !!p.category_formal_hedge },
  { key: 'wild_hedge', labelDe: 'Wildhecken', labelEn: 'Wild Hedges', check: p => !!p.category_wild_hedge },
  { key: 'ground_cover', labelDe: 'Bodendecker', labelEn: 'Ground Cover', check: p => !!p.category_ground_cover },
  { key: 'culinary', labelDe: 'Nutzpflanzen', labelEn: 'Culinary Plants', check: p => !!p.category_culinary_plant },
  { key: 'medicinal', labelDe: 'Heilpflanzen', labelEn: 'Medicinal Herbs', check: p => !!p.category_medicinal_herbs },
];

export function getPlantCategory(plant: Plant): PlantCategoryKey | null {
  for (const def of CATEGORY_DEFS) {
    if (def.check(plant)) return def.key;
  }
  return null;
}

export function getCategoryLabel(key: PlantCategoryKey, language: 'de' | 'en'): string {
  const def = CATEGORY_DEFS.find(d => d.key === key);
  if (!def) return key;
  return language === 'de' ? def.labelDe : def.labelEn;
}

export interface ZoneCategoryGroup {
  categoryKey: PlantCategoryKey;
  categoryLabel: string;
  selections: UserSelection[];
  plantCount: number;
}

export function groupSelectionsByCategory(
  selections: UserSelection[],
  language: 'de' | 'en' = 'de'
): ZoneCategoryGroup[] {
  const groups = new Map<PlantCategoryKey, UserSelection[]>();

  for (const sel of selections) {
    if (!sel.plant) continue;
    const catKey = getPlantCategory(sel.plant);
    if (!catKey) continue;
    if (!groups.has(catKey)) groups.set(catKey, []);
    groups.get(catKey)!.push(sel);
  }

  const result: ZoneCategoryGroup[] = [];
  for (const def of CATEGORY_DEFS) {
    const sels = groups.get(def.key);
    if (!sels || sels.length === 0) continue;
    result.push({
      categoryKey: def.key,
      categoryLabel: language === 'de' ? def.labelDe : def.labelEn,
      selections: sels,
      plantCount: sels.length,
    });
  }

  return result;
}

// ── Area storage (sessionStorage-based) ───────────────────────────────────

const AREA_STORAGE_KEY = 'zone-category-areas';

export type ZoneAreaMap = Record<string, Record<PlantCategoryKey, number | undefined>>;

export function loadZoneAreas(): ZoneAreaMap {
  try {
    const raw = sessionStorage.getItem(AREA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveZoneAreas(areas: ZoneAreaMap): void {
  try {
    sessionStorage.setItem(AREA_STORAGE_KEY, JSON.stringify(areas));
  } catch {
    // ignore quota errors
  }
}

export function getZoneAreaForCategory(
  areas: ZoneAreaMap,
  zoneId: string,
  categoryKey: PlantCategoryKey
): number | undefined {
  return areas[zoneId]?.[categoryKey];
}

export function setZoneAreaForCategory(
  areas: ZoneAreaMap,
  zoneId: string,
  categoryKey: PlantCategoryKey,
  areaM2: number | undefined
): ZoneAreaMap {
  const next = { ...areas };
  if (!next[zoneId]) next[zoneId] = {} as Record<PlantCategoryKey, number | undefined>;
  if (areaM2 === undefined || isNaN(areaM2)) {
    delete next[zoneId][categoryKey];
  } else {
    next[zoneId][categoryKey] = areaM2;
  }
  return next;
}
