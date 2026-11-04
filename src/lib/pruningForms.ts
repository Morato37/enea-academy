/**
 * Schnittformen (pruning / training forms) for trees.
 *
 * The catalogue and the sketches per genus live in code, so the database only needs one
 * text column on the selection item (`pruning_form`, holding a form code such as 'hochstamm').
 * Sketches are static files in /public/schnittformen/<genusKey>_<formCode>.png.
 */

export type PruningLanguage = 'de' | 'en' | 'it';

export type PruningFormCode =
  | 'hochstamm'
  | 'halbstamm'
  | 'mehrstaemmig'
  | 'etagen'
  | 'dach'
  | 'kuppel'
  | 'schirm'
  | 'hecke'
  | 'spalier_u'
  | 'spalier'
  | 'bonsai'
  | 'haenge'
  | 'strauch'
  | 'natur'
  | 'solitaer';

export interface PruningForm {
  code: PruningFormCode;
  label: Record<PruningLanguage, string>;
  hint: Record<PruningLanguage, string>;
}

export interface PruningOption {
  form: PruningForm;
  /** Public URL of the sketch for this genus and form. */
  sketchUrl: string;
}

export interface PruningGenusGroup {
  key: string;
  /** Display name of the sketch sheet, e.g. "Carpinus & Fagus". */
  name: string;
  /** Genera (first word of the botanical name) this sheet applies to. */
  genera: string[];
  forms: PruningFormCode[];
}

/**
 * Where the sketches are served from. Default: Vite public folder (/public/schnittformen).
 * Alternative if the files are uploaded to Supabase Storage instead:
 *   `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/plant-images/schnittformen`
 */
export const PRUNING_SKETCH_BASE = '/schnittformen';

export const PRUNING_FORMS: Record<PruningFormCode, PruningForm> = {
  hochstamm: {
    code: 'hochstamm',
    label: { de: 'Hochstamm', en: 'Standard tree', it: 'Fusto alto' },
    hint: { de: 'Stamm mit Krone', en: 'Clear stem with crown', it: 'Tronco con chioma' },
  },
  halbstamm: {
    code: 'halbstamm',
    label: { de: 'Halbstamm', en: 'Half-standard', it: 'Mezzo fusto' },
    hint: { de: 'Kurzer Stamm', en: 'Short stem', it: 'Tronco corto' },
  },
  mehrstaemmig: {
    code: 'mehrstaemmig',
    label: { de: 'Mehrstämmig', en: 'Multi-stem', it: 'Policormico' },
    hint: { de: 'Mehrere Stämme', en: 'Several stems', it: 'Più tronchi' },
  },
  etagen: {
    code: 'etagen',
    label: { de: 'Etagenform', en: 'Tiered form', it: 'Forma a palchi' },
    hint: { de: 'Krone in Schichten', en: 'Layered crown', it: 'Chioma a strati' },
  },
  dach: {
    code: 'dach',
    label: { de: 'Dachform', en: 'Roof-trained', it: 'Forma a tetto' },
    hint: { de: 'Flache Krone', en: 'Flat crown', it: 'Chioma piatta' },
  },
  kuppel: {
    code: 'kuppel',
    label: { de: 'Kuppelform', en: 'Dome form', it: 'Forma a cupola' },
    hint: { de: 'Breite, runde Krone', en: 'Wide rounded crown', it: 'Chioma ampia e tonda' },
  },
  schirm: {
    code: 'schirm',
    label: { de: 'Schirmform', en: 'Umbrella form', it: 'Forma a ombrello' },
    hint: { de: 'Breite Schirmkrone', en: 'Broad umbrella crown', it: 'Chioma a ombrello' },
  },
  hecke: {
    code: 'hecke',
    label: { de: 'Hecke', en: 'Hedge', it: 'Siepe' },
    hint: { de: 'Formschnitt als Block', en: 'Clipped block', it: 'Potatura a blocco' },
  },
  spalier_u: {
    code: 'spalier_u',
    label: { de: 'Spalier U-Form', en: 'U-cordon espalier', it: 'Spalliera a U' },
    hint: { de: 'An Wand oder Draht', en: 'On wall or wire', it: 'Su muro o filo' },
  },
  spalier: {
    code: 'spalier',
    label: { de: 'Spalier waagrecht', en: 'Horizontal espalier', it: 'Spalliera orizzontale' },
    hint: { de: 'Waagrechte Etagen', en: 'Horizontal tiers', it: 'Palchi orizzontali' },
  },
  bonsai: {
    code: 'bonsai',
    label: { de: 'Gartenbonsai', en: 'Garden bonsai', it: 'Bonsai da giardino' },
    hint: { de: 'Niwaki', en: 'Niwaki', it: 'Niwaki' },
  },
  haenge: {
    code: 'haenge',
    label: { de: 'Hängeform', en: 'Weeping form', it: 'Forma pendula' },
    hint: { de: 'Überhängende Zweige', en: 'Weeping branches', it: 'Rami ricadenti' },
  },
  strauch: {
    code: 'strauch',
    label: { de: 'Strauch', en: 'Shrub', it: 'Arbusto' },
    hint: { de: 'Buschig', en: 'Bushy', it: 'Cespuglioso' },
  },
  natur: {
    code: 'natur',
    label: { de: 'Natürlicher Wuchs', en: 'Natural habit', it: 'Portamento naturale' },
    hint: { de: 'Mit Leittrieb', en: 'With central leader', it: 'Con freccia' },
  },
  solitaer: {
    code: 'solitaer',
    label: { de: 'Solitär', en: 'Specimen tree', it: 'Esemplare' },
    hint: { de: 'Grosser Einzelbaum', en: 'Large single tree', it: 'Grande albero isolato' },
  },
};

/** Sketch sheets from the enea drawing set (10 sheets, 40 sketches). */
export const PRUNING_GENUS_GROUPS: PruningGenusGroup[] = [
  { key: 'acer', name: 'Acer', genera: ['acer'], forms: ['bonsai', 'kuppel', 'mehrstaemmig', 'etagen', 'hochstamm'] },
  { key: 'amelanchier', name: 'Amelanchier', genera: ['amelanchier'], forms: ['mehrstaemmig', 'etagen', 'hochstamm'] },
  { key: 'betula', name: 'Betula', genera: ['betula'], forms: ['mehrstaemmig', 'haenge', 'hochstamm'] },
  { key: 'carpinus-fagus', name: 'Carpinus & Fagus', genera: ['carpinus', 'fagus'], forms: ['hecke', 'dach', 'hochstamm', 'kuppel'] },
  { key: 'cornus', name: 'Cornus', genera: ['cornus'], forms: ['strauch', 'etagen', 'hochstamm', 'hecke'] },
  { key: 'magnolia', name: 'Magnolia', genera: ['magnolia'], forms: ['etagen', 'mehrstaemmig', 'solitaer'] },
  { key: 'obst', name: 'Obst (Malus, Pyrus, Prunus)', genera: ['malus', 'pyrus', 'prunus'], forms: ['spalier_u', 'spalier', 'etagen', 'halbstamm', 'hochstamm', 'solitaer'] },
  { key: 'parrotia', name: 'Parrotia', genera: ['parrotia'], forms: ['etagen', 'mehrstaemmig', 'kuppel'] },
  { key: 'pinus', name: 'Pinus', genera: ['pinus'], forms: ['mehrstaemmig', 'natur', 'bonsai', 'hochstamm', 'schirm'] },
  { key: 'platanus', name: 'Platanus', genera: ['platanus'], forms: ['dach', 'mehrstaemmig', 'hochstamm', 'solitaer'] },
];

/**
 * Standard set for genera without their own sheet. Uses representative sketches from other sheets
 * until dedicated drawings exist.
 */
export const PRUNING_STANDARD_SET: { code: PruningFormCode; sketch: string }[] = [
  { code: 'hochstamm', sketch: 'platanus_hochstamm.png' },
  { code: 'mehrstaemmig', sketch: 'platanus_mehrstaemmig.png' },
  { code: 'etagen', sketch: 'magnolia_etagen.png' },
  { code: 'dach', sketch: 'platanus_dach.png' },
  { code: 'kuppel', sketch: 'parrotia_kuppel.png' },
  { code: 'hecke', sketch: 'carpinus-fagus_hecke.png' },
  { code: 'solitaer', sketch: 'platanus_solitaer.png' },
];

export const PRUNING_FORM_CODES = Object.keys(PRUNING_FORMS) as PruningFormCode[];

export function isPruningFormCode(value: unknown): value is PruningFormCode {
  return typeof value === 'string' && value in PRUNING_FORMS;
}

/** Genus = first word of the botanical name, lowercase, ignoring a leading hybrid sign ("× Chitalpa"). */
export function getGenus(botanicalName: string | null | undefined): string {
  if (!botanicalName) return '';
  const words = botanicalName.trim().toLowerCase().split(/\s+/).filter(w => w !== '×' && w !== 'x');
  return (words[0] ?? '').replace(/[^a-zäöüéè-]/g, '');
}

export function getGenusGroup(botanicalName: string | null | undefined): PruningGenusGroup | null {
  const genus = getGenus(botanicalName);
  return PRUNING_GENUS_GROUPS.find(g => g.genera.includes(genus)) ?? null;
}

export function sketchUrl(fileName: string): string {
  return `${PRUNING_SKETCH_BASE}/${fileName}`;
}

/** All forms a user can pick for this plant, each with the matching sketch. */
export function getPruningOptions(botanicalName: string | null | undefined): PruningOption[] {
  const group = getGenusGroup(botanicalName);
  if (group) {
    return group.forms.map(code => ({ form: PRUNING_FORMS[code], sketchUrl: sketchUrl(`${group.key}_${code}.png`) }));
  }
  return PRUNING_STANDARD_SET.map(s => ({ form: PRUNING_FORMS[s.code], sketchUrl: sketchUrl(s.sketch) }));
}

/** True when the plant has its own sketch sheet (false = standard set). */
export function hasOwnPruningSketches(botanicalName: string | null | undefined): boolean {
  return getGenusGroup(botanicalName) !== null;
}

/** The option for a stored code, or null if nothing (or an unknown code) is stored. */
export function getPruningOption(
  botanicalName: string | null | undefined,
  code: string | null | undefined,
): PruningOption | null {
  if (!isPruningFormCode(code)) return null;
  const match = getPruningOptions(botanicalName).find(o => o.form.code === code);
  if (match) return match;
  // Code exists but the genus sheet has no drawing for it: show the standard sketch if there is one.
  const std = PRUNING_STANDARD_SET.find(s => s.code === code);
  return { form: PRUNING_FORMS[code], sketchUrl: std ? sketchUrl(std.sketch) : '' };
}

export function pruningFormLabel(code: string | null | undefined, language: PruningLanguage = 'de'): string {
  return isPruningFormCode(code) ? PRUNING_FORMS[code].label[language] : '';
}
