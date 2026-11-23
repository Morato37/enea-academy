import { CHOJ, lookupSpecies, hmaxOf } from './species';
import {
  SiteParams, SpeciesInfo, SpeciesCal, Services, TreeInput, TreeResult, FlagKey, ProjSnapshot,
  Totals, ProjTotals, SeriesPoint, Pollutants, DbhUnit,
} from './types';
import { applyDbhUnit } from './parse';
import { utdAllometry } from './crownAllometry';

/** Defaults: Rapperswil-Jona preset, park growth, i-Tree runoff share of canton SG, horizons 1/10/25, ARE-based prices. */
export const DEFAULT_PARAMS: SiteParams = {
  cO3: 50, cNO2: 15, cSO2: 1.5, cPM: 9, cCO: 250,
  precip: 1400, raindays: 140, ffd: 190, leafon: 195,
  landuse: 0.61, runoffShare: 0.0247, polFactor: 1.45,
  y1: 1, y2: 10, y3: 25,
  pCO2: 130, pO3: 3000, pNO2: 25000, pSO2: 15000, pPM: 250000, pCO: 1000, pRun: 2,
};

export const LANDUSE_OPTIONS = [
  { value: 0.61, key: 'lu1' },
  { value: 0.83, key: 'lu2' },
  { value: 0.38, key: 'lu3' },
] as const;

export const WARN_FLAGS: ReadonlySet<FlagKey> = new Set<FlagKey>(['fUnit', 'fUnknown', 'fDbh', 'fWidth']);

/**
 * Multiplier on canopy storage per rain event (evaporation during the event). Calibrated against
 * i-Tree MyTree (6 test trees, Rapperswil-Jona, Nov 2026): geometric mean of retained rain = i-Tree.
 * Was 1.8 before the leaf area came from the Urban Tree Database.
 */
export const INTERCEPT_FACTOR = 1.45;

/** kg O₂ per person per year (breathing needs of an adult). */
export const O2_PER_PERSON = 300;

/** Sanitise a parameter set: every field a finite number, like parseFloat(...) || 0 in the original. */
export function sanitizeParams(p: SiteParams): SiteParams {
  // parameters saved before a field existed get its default
  const out = { ...DEFAULT_PARAMS, ...p } as Record<string, number>;
  for (const k in out) if (!Number.isFinite(out[k])) out[k] = 0;
  return out as unknown as SiteParams;
}

/** Longest allowed projection horizon in years (the per-year growth loop runs once per tree per year). */
export const MAX_HORIZON = 100;

/** Projection horizons: clamped to 1..MAX_HORIZON and de-duplicated, so totals never count a year twice. */
export function horizons(p: SiteParams): number[] {
  return [...new Set([p.y1, p.y2, p.y3].map(v => Math.min(MAX_HORIZON, Math.max(1, Math.round(v || 0)))))];
}

/**
 * Correction of the Chojnacky groups to i-Tree's species equations, fitted on 26 MyTree reference
 * trees (docs/validation): factor exp(0.475) · DBH^−0.173, i.e. +10 % at 15 cm, −18 % at 50 cm.
 */
const C_CAL: [number, number] = [0.475, -0.173];

/** Per-species factor exp(a + b · ln(DBH / 30)); DBH held to the fitted range 10–100 cm. */
export const calFactor = (ab: [number, number] | undefined, dbh: number): number =>
  ab ? Math.exp(ab[0] + ab[1] * Math.log(Math.min(100, Math.max(10, dbh)) / 30)) : 1;

/**
 * Total carbon (kg) from DBH: Chojnacky biomass × roots 1.26 × urban factor 0.8 × C fraction 0.5,
 * calibrated to i-Tree, with the species correction when there is one.
 */
export function carbonKg(dbh: number, grp: string, cal?: SpeciesCal): number {
  const [b0, b1] = CHOJ[grp];
  return Math.exp(b0 + C_CAL[0] + (b1 + C_CAL[1]) * Math.log(dbh)) * 1.26 * 0.8 * 0.5 * calFactor(cal?.c, dbh);
}

/** Palm carbon (kg) from height (Frangi & Lugo 1985). */
export const carbonPalm = (h: number): number => {
  h = Math.max(0.5, h);
  const ag = h < 1.5 ? 6.666 * h / 1.5 : 6.666 + 12.826 * Math.sqrt(h) * Math.log(h);
  return ag * 1.26 * 0.5;
};

/** Leaf area after Nowak (1996), with Beer-Lambert fallback outside the regression range. */
export function leafArea(H: number, D: number, S: number): { la: number; ground: number; method: 'reg' | 'beer' } {
  const ground = Math.PI * D * D / 4;
  let la: number | null = null;
  let method: 'reg' | 'beer' = 'reg';
  const ratio = D > 0 ? H / D : 0;
  if (H > 0 && D > 0 && ratio >= 0.5 && ratio <= 2 && H <= 15 && D <= 15) {
    const C = Math.PI * D * (H + D) / 2;
    la = Math.exp(-4.3309 + 0.2942 * H + 0.7312 * D + 5.7217 * S - 0.0148 * C);
    const lai = la / ground;
    if (!(lai >= 0.5 && lai <= 8)) la = null;
  }
  if (la == null) { la = ground * (-Math.log(1 - S) / 0.5); method = 'beer'; }
  return { la, ground, method };
}

/**
 * Deposition velocities per m² leaf area (m/s), like i-Tree Eco, which computes the flux per unit leaf
 * area. Literature values per canopy area at LAI 4 (Nowak et al. 2006/2013; O3 0.35, NO2 0.20, SO2 0.30,
 * PM2.5 0.05, CO 0.003 cm/s) ÷ 4, scaled per pollutant (O3 ×1.45, NO2 ×1.74, SO2 ×1.10, PM2.5 ×3.96,
 * CO ×0.66) so that the median of the Swiss presets matches i-Tree MyTree (docs/validation); the
 * remaining difference per location is SiteParams.polFactor.
 */
export const VD: Pollutants = { O3: 0.00127, NO2: 0.000872, SO2: 0.000825, PM: 0.000495, CO: 0.00000495 };

/**
 * Diameter growth factor by i-Tree growth rate class (slow / moderate / fast), applied to the base
 * growth of the growing environment. Fitted on the MyTree reference trees (docs/validation).
 */
export const GROWTH_FACTOR: Record<'S' | 'M' | 'F', number> = { S: 1.15, M: 1.55, F: 1.75 };
const growthFactor = (sp: SpeciesInfo): number => GROWTH_FACTOR[sp.gr ?? 'M'] * (sp.cal?.g ?? 1);

export const vitality = (d: number): number => d <= 10 ? 1 : d <= 25 ? 0.76 : d <= 50 ? 0.42 : d <= 75 ? 0.15 : 0;

/**
 * Annual services for one set of dimensions (dbh cm, crown height cH m, crown diameter D m).
 * crownFactor scales an estimated crown (ground and leaf area, same leaf area index) to the size
 * i-Tree uses for the species (species calibration; 1 for measured crowns).
 */
export function services(
  dbh: number, cH: number, D: number, sp: SpeciesInfo, missing: number, dieback: number,
  growthOverride: number | null, h: number, p: SiteParams, leafAreaOverride: number | null = null, crownFactor = 1
): Services {
  const est = leafArea(cH, D, sp.S);
  const ground = est.ground * crownFactor;
  // leaf area from the Urban Tree Database when the crown itself was estimated from it
  const laRaw = (leafAreaOverride != null ? leafAreaOverride : est.la) * crownFactor;
  const method = leafAreaOverride != null ? 'utd' as const : est.method;
  const la = laRaw * (1 - missing / 100), lai = la / ground;
  const C = sp.palm ? carbonPalm(h) : carbonKg(dbh, sp.grp, sp.cal);
  const growth = growthOverride != null ? growthOverride : p.landuse * growthFactor(sp) * (p.ffd / 153) * vitality(dieback);
  const hGrow = 0.3 * vitality(dieback);
  const seq = sp.palm ? Math.max(0, carbonPalm(h + hGrow) - C) : Math.max(0, carbonKg(dbh + growth, sp.grp, sp.cal) - C);
  const o2 = seq * 32 / 12;
  const yr = 365 * 86400, leafon = p.leafon * 86400, tEff = sp.ev ? yr : (leafon + (yr - leafon) * 0.15);
  const conc: Pollutants = { O3: p.cO3, NO2: p.cNO2, SO2: p.cSO2, PM: p.cPM, CO: p.cCO };
  const pol = {} as Pollutants;
  (Object.keys(VD) as (keyof Pollutants)[]).forEach(k => { pol[k] = VD[k] * conc[k] * 1e-6 * la * tEff * p.polFactor; });
  const Pmm = p.precip, N = Math.max(1, p.raindays), pbar = Pmm / N;
  const inter = (l: number) => { const S = 0.2 * l + 0.1; return S * (1 - Math.exp(-pbar / S)) * INTERCEPT_FACTOR; };
  const fLeaf = sp.ev ? 1 : Math.min(1, p.leafon / 365);
  // rain retained by the crown (m³/yr); only a site-specific share of it would have run off
  const intercept = Math.min(N * (fLeaf * inter(lai) + (1 - fLeaf) * inter(0.5)), Pmm) / 1000 * ground;
  const runoff = intercept * p.runoffShare;
  const vC = seq * 3.667 / 1000 * p.pCO2;
  const vAir = pol.O3 / 1e6 * p.pO3 + pol.NO2 / 1e6 * p.pNO2 + pol.SO2 / 1e6 * p.pSO2 + pol.PM / 1e6 * p.pPM + pol.CO / 1e6 * p.pCO;
  const vRun = runoff * p.pRun;
  return { ground, la, lai, method, C, seq, o2, pol, intercept, runoff, vC, vAir, vRun, chf: vC + vAir + vRun, growth };
}

export const polSumOf = (pol: Pollutants): number => pol.O3 + pol.NO2 + pol.SO2 + pol.PM + pol.CO;

/** Full result for one tree, including the growth projection over all horizons. */
export function calcTree(t: TreeInput, p: SiteParams): TreeResult {
  const sp = lookupSpecies(t.species);
  const flags: FlagKey[] = [];
  if (sp.dflt) flags.push('fUnknown'); else if (sp.genus) flags.push('fGenus');
  // species not (fully) known: take the evergreen flag from the plant database when available
  if ((sp.dflt || sp.genus) && t.evergreenHint != null) sp.ev = t.evergreenHint ? 1 : 0;

  const dbh = t.dbh, h = t.height;
  const top = t.top != null && t.top > 0 ? t.top : h;
  // Crown dimensions that were not measured come from the USDA Urban Tree Database (species,
  // close relative or genus); crown height is scaled to the entered tree height.
  const utd = sp.palm ? null : utdAllometry(t.species);
  const utdCrownHeight = (d: number, treeH: number) =>
    Math.min(0.9 * treeH, utd!.predict('ch', d) * treeH / utd!.predict('h', d));
  const baseMeasured = t.base != null && !Number.isNaN(t.base) && t.base >= 0;
  const base = baseMeasured ? t.base! : utd ? Math.max(0, top - utdCrownHeight(dbh, top)) : Math.max(0, h * 0.35);
  if (!baseMeasured) flags.push('fBase');
  const cH = Math.max(0.3, top - base);
  const wNS = t.wNS ?? NaN, wEW = t.wEW ?? NaN;
  let D = (wNS > 0 && wEW > 0) ? (wNS + wEW) / 2 : (wNS > 0 ? wNS : (wEW > 0 ? wEW : NaN));
  const crownFromUtd = !(D > 0) && !!utd;
  if (crownFromUtd) { D = utd!.predict('cd', dbh); flags.push('fWidthUtd'); }
  else if (!(D > 0)) { D = Math.max(1, 0.15 * dbh + 1); flags.push('fWidth'); }
  const missing = t.missing == null || Number.isNaN(t.missing) ? 0 : t.missing;
  const dieback = t.dieback == null || Number.isNaN(t.dieback) ? 0 : t.dieback;
  const utdLeafArea = (d: number) => crownFromUtd ? utd!.predict('la', d) : null;
  // the species correction to i-Tree's crown size only applies to crowns that were not measured
  const crownMeasured = wNS > 0 || wEW > 0;
  const crownFactor = (d: number) => crownMeasured ? 1 : calFactor(sp.cal?.crown, d);
  const now = services(dbh, cH, D, sp, missing, dieback, null, h, p, utdLeafArea(dbh), crownFactor(dbh));
  if (sp.palm) flags.push('fPalm');
  if (now.method === 'beer') flags.push('fBeer');
  if (dbh > 100 && !sp.palm) flags.push('fDbh');

  // growth projection: DBH grows, height & crown follow by urban allometry, growth damps near max height
  const hmax = hmaxOf(t.species), H = horizons(p), maxY = Math.max(...H);
  const baseGrowth = p.landuse * growthFactor(sp) * (p.ffd / 153) * vitality(dieback);
  const snap = (y: number, s: Services, d: number, hh: number, cum: number): ProjSnapshot => ({
    y, dbh: d, h: hh, C: s.C, seq: s.seq, o2: s.o2, chf: s.chf, cum, intercept: s.intercept, runoff: s.runoff, polSum: polSumOf(s.pol), pol: s.pol,
    ground: s.ground, la: s.la, vC: s.vC, vAir: s.vAir, vRun: s.vRun,
  });
  let d = dbh, hh = h, cum = 0;
  const series: ProjSnapshot[] = [snap(0, now, d, hh, 0)];
  const proj: Record<number, ProjSnapshot> = {};
  for (let y = 1; y <= maxY; y++) {
    const damp = Math.max(0.1, 1 - 0.9 * Math.pow(Math.min(1, hh / hmax), 2));
    let g: number, Dy: number, cHy: number;
    if (sp.palm) {
      g = 0;
      hh = Math.min(hmax, hh + 0.3 * vitality(dieback) * damp);
      Dy = D * Math.pow(hh / h, 0.5);
      cHy = Math.max(0.3, cH * Math.pow(hh / h, 0.5));
    } else {
      g = baseGrowth * damp;
      const ratio = (d + g) / d;
      d += g;
      hh = Math.min(hmax, hh * Math.pow(ratio, 0.6));
      Dy = crownFromUtd ? utd!.predict('cd', d) : D * Math.pow(d / dbh, 0.7);
      cHy = !baseMeasured && utd ? Math.max(0.3, utdCrownHeight(d, hh)) : Math.max(0.3, cH * Math.pow(d / dbh, 0.5));
    }
    const s = services(d, cHy, Dy, sp, missing, dieback, g, hh, p, utdLeafArea(d), crownFactor(d));
    cum += s.chf;
    const sn = snap(y, s, d, hh, cum);
    series.push(sn);
    if (H.includes(y)) proj[y] = { ...sn, D: Dy };
  }
  return { ...t, sp, ...now, flags, proj, series, hmax };
}

export interface CalcResult {
  rows: TreeResult[];
  skipped: TreeInput[];
}

/** Run the calculation for a list of trees; rows without DBH or height are skipped. */
export function calcAll(trees: TreeInput[], unit: DbhUnit, params: SiteParams): CalcResult {
  const p = sanitizeParams(params);
  const conv = applyDbhUnit(trees, unit);
  const skipped = conv.filter(t => !(t.dbh > 0) || !(t.height > 0));
  const rows = conv.filter(t => t.dbh > 0 && t.height > 0).map(t => calcTree(t, p));
  // plausibility: stem thicker than 1/8 of tree height is almost certainly a unit error
  for (const r of rows) { if (!r.sp.palm && r.dbh / 100 > r.height / 8) r.flags.unshift('fUnit'); }
  return { rows, skipped };
}

const PK: (keyof ProjTotals)[] = ['C', 'seq', 'o2', 'chf', 'cum', 'intercept', 'runoff', 'polSum', 'ground', 'la', 'vC', 'vAir', 'vRun', 'dbh'];

export function totals(rows: TreeResult[], params: SiteParams): Totals {
  const p = sanitizeParams(params);
  const s: Totals = {
    ground: 0, la: 0, C: 0, seq: 0, o2: 0, CO: 0, O3: 0, NO2: 0, SO2: 0, PM: 0, intercept: 0, runoff: 0, vC: 0, vAir: 0, vRun: 0, chf: 0,
    polSum: 0, dbhSum: 0, proj: {},
  };
  const H = horizons(p);
  for (const y of H) s.proj[y] = Object.fromEntries(PK.map(k => [k, 0])) as unknown as ProjTotals;
  for (const r of rows) {
    for (const k of ['ground', 'la', 'C', 'seq', 'o2', 'intercept', 'runoff', 'vC', 'vAir', 'vRun', 'chf'] as const) s[k] += r[k];
    for (const k of Object.keys(r.pol) as (keyof Pollutants)[]) s[k] += r.pol[k];
    for (const y of H) { const q = r.proj[y], t = s.proj[y]; for (const k of PK) t[k] += q[k]; }
  }
  s.polSum = s.O3 + s.NO2 + s.SO2 + s.PM + s.CO;
  s.dbhSum = rows.reduce((a, r) => a + r.dbh, 0);
  return s;
}

/** Year-by-year totals from today to the furthest horizon. */
export function seriesTotal(rows: TreeResult[], params: SiteParams): SeriesPoint[] {
  const n = Math.max(...horizons(sanitizeParams(params)));
  const out: SeriesPoint[] = [];
  for (let y = 0; y <= n; y++) {
    const o = { y } as SeriesPoint;
    for (const k of PK) o[k] = 0;
    for (const r of rows) { const q = r.series[y]; for (const k of PK) o[k] += q[k]; }
    out.push(o);
  }
  return out;
}
