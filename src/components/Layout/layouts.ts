import { MoodboardLayout, MoodboardSlot, MoodboardType, PlantGroup } from './types';

/**
 * Geometry measured from the enea moodboard templates and the Glasenberg example.
 * All values are millimetres on A4 landscape (297 × 210). A3 uses exactly the same proportions,
 * the PDF export scales everything by 420 / 297.
 * 8.5 mm margin, 4 columns of 68.7 mm, 1.8 mm gutter, picture area from y = 39.8 to y = 161.6.
 */
export const PAGE = { w: 297, h: 210, margin: 8.5, gutter: 1.8 } as const;

export type PaperFormat = 'a3' | 'a4';
export const PAPER: Record<PaperFormat, { w: number; h: number; scale: number }> = {
  a4: { w: 297, h: 210, scale: 1 },
  a3: { w: 420, h: 297, scale: 420 / 297 },
};

/**
 * Tags that make a picture a good fit for big "scene" slots or small "detail" slots.
 * Compared lowercase with ä/ö/ü written as ae/oe/ue. Adjust to the tags the image search really uses.
 */
export const SCENE_TAGS = [
  'garten', 'gartensituation', 'gartenszene', 'situation', 'anwendung', 'referenz', 'atmosphaere', 'stimmung',
  'bepflanzung', 'landschaft', 'park', 'weg', 'terrasse', 'innenhof', 'garden', 'garden scene', 'landscape',
  // most frequent scene tags in the image search
  'enea garden', 'garden design', 'garden path', 'scenery', 'natural landscape', 'landscape architecture', 'garden bed',
  'garden beds', 'planting', 'japanese garden', 'garden atmosphere', 'floral landscape', 'garden layout', 'tranquil scene',
] as const;
export const DETAIL_TAGS = [
  'detail', 'bluete', 'bluetenstand', 'blatt', 'blaetter', 'frucht', 'rinde', 'nahaufnahme', 'textur', 'zweig', 'flower', 'leaf', 'close-up',
  // most frequent detail tags in the image search
  'close up', 'macro', 'bark', 'texture', 'blossom', 'leaves', 'petals', 'foliage detail', 'flower head', 'seed head', 'berries', 'fruit',
] as const;

const COL = [8.5, 79.0, 149.5, 220.0];
const FULL = 68.7;
const HALF = 33.45;
const R = (col: number) => COL[col] + HALF + PAGE.gutter; // right half of a column

/** The 19-slot grid shared by "Saisonalität" (G) and "Pflanzenauswahl" (F). */
function fourColumnGrid(keys: [string, string, string, string]): MoodboardSlot[] {
  const [c0, c1, c2, c3] = keys;
  const s = (column: string, n: number, x: number, y: number, w: number, h: number): MoodboardSlot => ({
    id: `${column}-${n}`, column, x, y, w, h, prefer: w > 60 ? SCENE_TAGS : DETAIL_TAGS,
  });
  return [
    s(c0, 1, COL[0], 39.8, FULL, 44.5),
    s(c0, 2, COL[0], 86.0, HALF, 37.0),
    s(c0, 3, R(0), 86.0, HALF, 37.0),
    s(c0, 4, COL[0], 124.8, FULL, 36.8),

    s(c1, 1, COL[1], 39.8, HALF, 29.1),
    s(c1, 2, R(1), 39.8, HALF, 29.1),
    s(c1, 3, COL[1], 70.7, FULL, 36.8),
    s(c1, 4, COL[1], 109.2, FULL, 52.4),

    s(c2, 1, COL[2], 39.8, HALF, 60.0),
    s(c2, 2, R(2), 39.8, HALF, 29.1),
    s(c2, 3, R(2), 70.7, HALF, 29.1),
    s(c2, 4, COL[2], 101.6, FULL, 29.1),
    s(c2, 5, COL[2], 132.5, HALF, 29.1),
    s(c2, 6, R(2), 132.5, HALF, 29.1),

    s(c3, 1, COL[3], 39.8, HALF, 52.4),
    s(c3, 2, R(3), 39.8, HALF, 29.1),
    s(c3, 3, R(3), 70.7, HALF, 52.4),
    s(c3, 4, COL[3], 93.9, HALF, 29.1),
    s(c3, 5, COL[3], 124.8, FULL, 36.8),
  ];
}

export const PLANT_GROUP_LABELS: Record<PlantGroup, string> = {
  baeume: 'Bäume',
  straeucher: 'Sträucher',
  graeser_stauden: 'Gräser + Stauden',
  kletter_boden: 'Kletterpflanzen + Bodendecker',
};

/**
 * Season tags as they may appear in the image search. Compared lowercase and with
 * ä/ö/ü written as ae/oe/ue, so "Frühling" and "fruehling" both match.
 * Extend these lists if the image search uses other words.
 */
export const SEASON_TAGS = {
  fruehling: ['fruehling', 'fruehjahr', 'fruehlingsaspekt', 'fruehlingsbluete', 'spring', 'primavera'],
  sommer: ['sommer', 'sommeraspekt', 'sommerbluete', 'summer', 'estate'],
  herbst: ['herbst', 'herbstaspekt', 'herbstfaerbung', 'herbstfarbe', 'herbstlaub', 'autumn', 'fall', 'autunno'],
  winter: ['winter', 'winteraspekt', 'winterstruktur', 'inverno'],
} as const;

export const LAYOUTS: Record<MoodboardType, MoodboardLayout> = {
  saison: {
    type: 'saison',
    code: 'G',
    name: 'Saisonalität',
    description: 'Vier Spalten Frühling, Sommer, Herbst, Winter. Bilder werden über die Jahreszeiten-Tags gewählt.',
    subtitle: 'Saisonalität',
    columns: [
      { key: 'fruehling', label: 'Frühling', tags: [...SEASON_TAGS.fruehling] },
      { key: 'sommer', label: 'Sommer', tags: [...SEASON_TAGS.sommer] },
      { key: 'herbst', label: 'Herbst', tags: [...SEASON_TAGS.herbst] },
      { key: 'winter', label: 'Winter', tags: [...SEASON_TAGS.winter] },
    ],
    slots: fourColumnGrid(['fruehling', 'sommer', 'herbst', 'winter']),
    minPlants: 4,
    maxPlants: null,
    recommendedPlants: '8 bis 12 Pflanzen',
    onePagePerPlant: false,
  },
  pflanzenauswahl: {
    type: 'pflanzenauswahl',
    code: 'F',
    name: 'Pflanzenauswahl',
    description: 'Vier Spalten Bäume, Sträucher, Gräser + Stauden, Kletterpflanzen + Bodendecker.',
    subtitle: 'Pflanzenauswahl',
    columns: (['baeume', 'straeucher', 'graeser_stauden', 'kletter_boden'] as PlantGroup[]).map(g => ({
      key: g, label: PLANT_GROUP_LABELS[g], tags: [], group: g,
    })),
    slots: fourColumnGrid(['baeume', 'straeucher', 'graeser_stauden', 'kletter_boden']),
    minPlants: 4,
    maxPlants: null,
    recommendedPlants: '8 bis 12 Pflanzen, mindestens 2 pro Spalte',
    onePagePerPlant: false,
  },
  portrait: {
    type: 'portrait',
    code: 'J',
    name: 'Pflanzenportrait',
    description: 'Fünf Bilder, grosse Gartenszene in der Mitte. Normalerweise eine Seite pro Pflanze, wahlweise mehrere Pflanzen zu einem Thema auf einer Seite.',
    subtitle: 'Pflanzenportrait',
    columns: [{ key: 'main', label: '', tags: [] }],
    // Measured from the Glasenberg example: big garden scene in the middle, details left and right.
    slots: [
      { id: 'main-1', column: 'main', x: 79.0, y: 39.8, w: 139.2, h: 121.8, prefer: SCENE_TAGS },
      { id: 'main-2', column: 'main', x: COL[0], y: 39.8, w: FULL, h: 67.8, prefer: SCENE_TAGS },
      { id: 'main-3', column: 'main', x: COL[3], y: 93.8, w: FULL, h: 67.8, prefer: DETAIL_TAGS },
      { id: 'main-4', column: 'main', x: COL[0], y: 109.4, w: FULL, h: 52.2, prefer: DETAIL_TAGS },
      { id: 'main-5', column: 'main', x: COL[3], y: 39.8, w: FULL, h: 52.2, prefer: DETAIL_TAGS },
    ],
    minPlants: 1,
    maxPlants: 12,
    recommendedPlants: '1 Pflanze pro Seite, oder 2 bis 5 Pflanzen zu einem Thema auf einer Seite',
    onePagePerPlant: true,
  },
};

export const MOODBOARD_TYPES: MoodboardType[] = ['saison', 'pflanzenauswahl', 'portrait'];
