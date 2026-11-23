// Shared types for the tree benefits (simplified i-Tree Eco) calculator.

export type Lang = 'de' | 'en';

export type DbhUnit = 'cm' | 'mm' | 'circ';

export type SizeClassKey = 'small' | 'medium' | 'large';

/** Site, climate, growth and valuation parameters. All values editable by the user. */
export interface SiteParams {
  // Air pollutants, annual means µg/m³
  cO3: number;
  cNO2: number;
  cSO2: number;
  cPM: number;
  cCO: number;
  // Climate
  precip: number;   // mm per year
  raindays: number; // days with ≥ 1 mm
  ffd: number;      // frost-free days
  leafon: number;   // leaf-on days for deciduous trees
  // Site conditions
  landuse: number;  // base DBH growth cm/yr (park 0.61, street 0.83, stand 0.38)
  /**
   * Share of the rain retained by the crown that counts as avoided runoff (0..1). From i-Tree
   * for the location (canton level): most retained rain would otherwise have infiltrated.
   */
  runoffShare: number;
  /**
   * Correction of the pollutant removal to i-Tree for the location (canton level): i-Tree uses its own
   * hourly pollution and weather data. 1 = median of the Swiss presets.
   */
  polFactor: number;
  // Projection horizons (years)
  y1: number;
  y2: number;
  y3: number;
  // Valuation, CHF per tonne resp. CHF per m³
  pCO2: number;
  pO3: number;
  pNO2: number;
  pSO2: number;
  pPM: number;
  pCO: number;
  pRun: number;
}

export interface SiteInfo {
  name: string;
  elev: number;
  src: 'preset' | 'live' | 'custom';
}

export interface SitePreset {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elev: number;
  c: { O3: number; NO2: number; SO2: number; PM: number; CO: number };
  precip: number;
  raindays: number;
  ffd: number;
  leafon: number;
  /** i-Tree avoided-runoff share of the canton (see SiteParams.runoffShare). */
  runoffShare: number;
  /** Pollutant removal correction to i-Tree for the canton (see SiteParams.polFactor). */
  polFactor: number;
}

export interface SpeciesInfo {
  S: number;        // shading factor (Nowak 1996)
  ev: 0 | 1;        // evergreen
  grp: string;      // Chojnacky biomass group
  palm?: 1;         // palm / non-tree: biomass from height
  dflt?: 1;         // unknown species, default broadleaf used
  genus?: 1;        // matched at genus level only
  gr?: 'S' | 'M' | 'F'; // i-Tree growth rate class (slow / moderate / fast)
  cal?: SpeciesCal; // per-species correction to i-Tree MyTree (speciesCalibration.ts)
}

/**
 * Per-species correction to i-Tree MyTree. c and crown are [a, b] of the factor exp(a + b · ln(DBH / 30));
 * g multiplies the diameter growth.
 */
export interface SpeciesCal {
  c?: [number, number];     // carbon storage
  g?: number;               // diameter growth
  crown?: [number, number]; // crown area and leaf area (same leaf area index), only when the crown was not measured
}

/** One measured or standardised tree, as entered by the user. */
export interface TreeInput {
  species: string;
  id?: string;
  dbh: number;      // cm (already converted to diameter cm)
  height: number;   // total height m
  top?: number;     // crown top height m
  base?: number;    // crown base height m
  wNS?: number;     // crown width N/S m
  wEW?: number;     // crown width E/W m
  missing?: number; // crown missing %
  dieback?: number; // crown dieback %
  /** From the plant database: overrides evergreen flag when the species is not in the internal table. */
  evergreenHint?: boolean;
  sizeClass?: SizeClassKey;
}

export type FlagKey =
  | 'fUnit' | 'fUnknown' | 'fGenus' | 'fPalm' | 'fBase' | 'fWidth' | 'fWidthUtd' | 'fBeer' | 'fDbh';

export interface Pollutants {
  O3: number;
  NO2: number;
  SO2: number;
  PM: number;
  CO: number;
}

/** Annual services for one set of tree dimensions. */
export interface Services {
  ground: number;  // crown ground area m²
  la: number;      // leaf area m²
  lai: number;
  method: 'reg' | 'beer' | 'utd';
  C: number;       // carbon storage kg
  seq: number;     // carbon sequestration kg/yr
  o2: number;      // oxygen production kg/yr
  pol: Pollutants; // g/yr
  intercept: number; // rain retained by the crown m³/yr
  runoff: number;  // avoided runoff m³/yr (intercept × runoffShare)
  vC: number;      // CHF/yr
  vAir: number;
  vRun: number;
  chf: number;
  growth: number;  // cm DBH per year
}

/** Snapshot of one projection year (per tree). */
export interface ProjSnapshot {
  y: number;
  dbh: number;
  h: number;
  C: number;
  seq: number;
  o2: number;
  chf: number;
  cum: number;
  intercept: number;
  runoff: number;
  polSum: number;
  pol: Pollutants;
  ground: number;
  la: number;
  vC: number;
  vAir: number;
  vRun: number;
  D?: number;
}

export interface TreeResult extends TreeInput, Services {
  sp: SpeciesInfo;
  flags: FlagKey[];
  proj: Record<number, ProjSnapshot>;
  series: ProjSnapshot[];
  hmax: number;
}

export interface ProjTotals {
  C: number; seq: number; o2: number; chf: number; cum: number; intercept: number; runoff: number;
  polSum: number; ground: number; la: number; vC: number; vAir: number; vRun: number; dbh: number;
}

export interface Totals extends Pollutants {
  ground: number; la: number; C: number; seq: number; o2: number; intercept: number; runoff: number;
  vC: number; vAir: number; vRun: number; chf: number;
  polSum: number; dbhSum: number;
  proj: Record<number, ProjTotals>;
}

export interface SeriesPoint extends ProjTotals {
  y: number;
}

/** Standard dimensions for a tree size class (nursery / planting standard, editable). */
export interface SizeClassStandard {
  label: string;      // e.g. 'StU 16–18'
  dbh: number;        // cm
  height: number;     // m
  crownWidth: number; // m
  crownBase: number;  // m
}

/** A tree species handed over from a project selection. */
export interface ProjectTreeInput {
  key: string;
  plantId?: number;
  species: string;
  commonName?: string;
  quantity: number;
  evergreen?: boolean;
  sizeClass: SizeClassKey;
}

export interface ProjectHandover {
  projectName?: string;
  zoneName?: string;
  trees: ProjectTreeInput[];
}
