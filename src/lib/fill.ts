import { LAYOUTS, PLANT_GROUP_LABELS } from './layouts';
import {
  MoodboardColumn,
  MoodboardImage,
  MoodboardLayout,
  MoodboardPage,
  MoodboardPlant,
  MoodboardSlot,
  MoodboardType,
  MoodboardWarning,
  SlotAssignment,
} from './types';

/** Lowercase, ä/ö/ü → ae/oe/ue, ß → ss, trimmed. */
export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim();
}

const key = (id: string | number) => String(id);

/** True if the picture fits the column (season tag) – columns without tags accept everything. */
export function imageFitsColumn(image: MoodboardImage, column: MoodboardColumn): boolean {
  if (!column.tags.length) return true;
  const tags = new Set(image.tags.map(normalizeTag));
  return column.tags.some(t => tags.has(normalizeTag(t)));
}

/** Plants allowed in a column. */
export function plantsForColumn(column: MoodboardColumn, plants: MoodboardPlant[]): MoodboardPlant[] {
  return column.group ? plants.filter(p => p.group === column.group) : plants;
}

/** Small deterministic random generator so "Neu mischen" gives a new but reproducible result. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function shuffle<T>(list: T[], seed: number): T[] {
  if (!seed) return [...list];
  const r = rng(seed);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * How badly a picture fits a slot (0 = perfect): shape difference plus a penalty when the picture
 * has none of the slot's preferred tags (garden scene for big slots, detail for small ones).
 */
export function slotPenalty(image: MoodboardImage, slot: MoodboardSlot): number {
  const shape = !image.width || !image.height
    ? 0.5
    : Math.abs(Math.log(image.width / image.height) - Math.log(slot.w / slot.h));
  if (!slot.prefer?.length) return shape;
  const tags = new Set(image.tags.map(normalizeTag));
  const hit = slot.prefer.some(t => tags.has(normalizeTag(t)));
  return shape + (hit ? 0 : 0.8);
}

/**
 * Fills one page. Biggest slots first; plants take turns so every plant appears before one
 * appears twice; every picture is used at most once per export (`used` is shared across pages).
 */
function fillPage(
  layout: MoodboardLayout,
  plants: MoodboardPlant[],
  images: MoodboardImage[],
  used: Set<string>,
  seed: number,
): SlotAssignment[] {
  const byPlant = new Map<string, MoodboardImage[]>();
  for (const img of images) {
    const k = key(img.plantId);
    if (!byPlant.has(k)) byPlant.set(k, []);
    byPlant.get(k)!.push(img);
  }
  const assignments = new Map<string, SlotAssignment>();

  layout.columns.forEach((column, ci) => {
    const slots = layout.slots
      .filter(s => s.column === column.key)
      .sort((a, b) => b.w * b.h - a.w * a.h);
    // plants that have at least one fitting, unused picture for this column
    const pool = shuffle(plantsForColumn(column, plants), seed ? seed + ci : 0).filter(p =>
      (byPlant.get(key(p.id)) ?? []).some(img => imageFitsColumn(img, column)),
    );
    let turn = 0;
    for (const slot of slots) {
      let placed: SlotAssignment | null = null;
      for (let tries = 0; tries < pool.length && !placed; tries++) {
        const plant = pool[(turn + tries) % pool.length];
        const candidates = (byPlant.get(key(plant.id)) ?? []).filter(
          img => !used.has(img.id) && imageFitsColumn(img, column),
        );
        if (!candidates.length) continue;
        const ordered = shuffle(candidates, seed ? seed + slot.id.length + ci : 0);
        const best = ordered.reduce((a, b) => (slotPenalty(b, slot) < slotPenalty(a, slot) ? b : a));
        used.add(best.id);
        placed = { slotId: slot.id, image: best, plant };
        turn = (turn + tries + 1) % pool.length;
      }
      assignments.set(slot.id, placed ?? { slotId: slot.id, image: null, plant: null });
    }
  });

  return layout.slots.map(s => assignments.get(s.id) ?? { slotId: s.id, image: null, plant: null });
}

export interface GenerateOptions {
  /** 0 = stable order (selection order); any other number shuffles ("Neu mischen"). */
  seed?: number;
  /**
   * Only for "Pflanzenportrait": true (default) = one page per plant,
   * false = all chosen plants together on one page (e.g. "weiss blühende Sträucher").
   */
  onePagePerPlant?: boolean;
}

/** Builds all pages for the chosen board type. */
export function generateMoodboard(
  type: MoodboardType,
  plants: MoodboardPlant[],
  images: MoodboardImage[],
  options: GenerateOptions = {},
): MoodboardPage[] {
  const layout = LAYOUTS[type];
  const seed = options.seed ?? 0;
  const used = new Set<string>();
  const perPlant = layout.onePagePerPlant && (options.onePagePerPlant ?? true);
  if (perPlant) {
    return plants.map(p => ({
      layout,
      detail: p.botanicalName,
      plant: p,
      slots: fillPage(layout, [p], images.filter(i => key(i.plantId) === key(p.id)), used, seed),
    }));
  }
  const detail = layout.onePagePerPlant ? plants.map(p => p.botanicalName).join(', ') : layout.name;
  return [{ layout, detail, plant: null, slots: fillPage(layout, plants, images, used, seed) }];
}

/** Checks the plant choice before generating. Errors block the "Generieren" button, warnings do not. */
export function validateSelection(
  type: MoodboardType,
  plants: MoodboardPlant[],
  images: MoodboardImage[],
  onePagePerPlant = true,
): MoodboardWarning[] {
  const layout = LAYOUTS[type];
  const out: MoodboardWarning[] = [];
  const n = plants.length;

  if (n < layout.minPlants) {
    out.push({
      level: 'error',
      message: `${layout.name} braucht mindestens ${layout.minPlants} Pflanze${layout.minPlants === 1 ? '' : 'n'}, gewählt sind ${n}.`,
    });
  }
  if (layout.maxPlants !== null && n > layout.maxPlants && (type !== 'portrait' || onePagePerPlant)) {
    out.push({ level: 'error', message: `${layout.name} erlaubt höchstens ${layout.maxPlants} Pflanzen, gewählt sind ${n}.` });
  }

  const imagesOf = (p: MoodboardPlant) => images.filter(i => key(i.plantId) === key(p.id));

  for (const p of plants) {
    if (!imagesOf(p).length) out.push({ level: 'warning', message: `${p.botanicalName}: keine Bilder in der Bildersuche.` });
  }

  if (type === 'portrait') {
    if (!onePagePerPlant && n > layout.slots.length) {
      out.push({ level: 'error', message: `Auf einer Seite haben höchstens ${layout.slots.length} Pflanzen Platz, gewählt sind ${n}.` });
    }
    for (const p of onePagePerPlant ? plants : []) {
      const c = imagesOf(p).length;
      if (c > 0 && c < layout.slots.length) {
        out.push({ level: 'warning', message: `${p.botanicalName}: nur ${c} von ${layout.slots.length} Bildern vorhanden, Felder bleiben leer.` });
      }
    }
  } else {
    for (const column of layout.columns) {
      const inColumn = plantsForColumn(column, plants);
      const fitting = images.filter(i => inColumn.some(p => key(p.id) === key(i.plantId)) && imageFitsColumn(i, column));
      const slotCount = layout.slots.filter(s => s.column === column.key).length;
      if (column.group && !inColumn.length) {
        out.push({ level: 'warning', message: `Keine ${PLANT_GROUP_LABELS[column.group]} gewählt, die Spalte bleibt leer.` });
      } else if (!fitting.length) {
        out.push({ level: 'warning', message: `${column.label}: keine passenden Bilder${column.tags.length ? ' mit diesem Jahreszeiten-Tag' : ''}, die Spalte bleibt leer.` });
      } else if (fitting.length < slotCount) {
        out.push({ level: 'warning', message: `${column.label}: nur ${fitting.length} passende Bilder für ${slotCount} Felder.` });
      }
    }
    if (type === 'pflanzenauswahl') {
      const noGroup = plants.filter(p => !p.group);
      if (noGroup.length) {
        out.push({ level: 'warning', message: `${noGroup.length} Pflanze(n) passen in keine Spalte und werden nicht verwendet: ${noGroup.map(p => p.botanicalName).join(', ')}.` });
      }
    }
  }
  return out;
}

/** Pictures that could replace the one in a slot (fit the column, belong to an allowed plant, not used elsewhere). */
export function slotAlternatives(
  page: MoodboardPage,
  slotId: string,
  plants: MoodboardPlant[],
  images: MoodboardImage[],
  allPages: MoodboardPage[] = [page],
): { image: MoodboardImage; plant: MoodboardPlant }[] {
  const slot = page.layout.slots.find(s => s.id === slotId);
  const column = page.layout.columns.find(c => c.key === slot?.column);
  if (!slot || !column) return [];
  const usedIds = new Set(allPages.flatMap(p => p.slots.map(a => a.image?.id).filter((v): v is string => !!v)));
  const current = page.slots.find(a => a.slotId === slotId)?.image?.id;
  const allowed = page.plant ? [page.plant] : plantsForColumn(column, plants);
  const plantById = new Map(allowed.map(p => [key(p.id), p]));
  return images
    .filter(i => plantById.has(key(i.plantId)) && imageFitsColumn(i, column) && (!usedIds.has(i.id) || i.id === current))
    .map(i => ({ image: i, plant: plantById.get(key(i.plantId))! }));
}

/** Returns a copy of the pages with one slot changed (image null = empty the slot). */
export function replaceSlot(
  pages: MoodboardPage[],
  pageIndex: number,
  slotId: string,
  image: MoodboardImage | null,
  plant: MoodboardPlant | null,
): MoodboardPage[] {
  return pages.map((p, i) =>
    i !== pageIndex ? p : { ...p, slots: p.slots.map(s => (s.slotId === slotId ? { slotId, image, plant } : s)) },
  );
}
