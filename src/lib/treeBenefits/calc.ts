import { CHOJ, lookupSpecies, hmaxOf } from './species';
import {
  SiteParams, SpeciesInfo, Services, TreeInput, TreeResult, FlagKey, ProjSnapshot,
  Totals, ProjTotals, SeriesPoint, Pollutants, DbhUnit,
} from './types';
import { applyDbhUnit } from './parse';

/** Defaults: Rapperswil-Jona preset, park growth, mixed surface, horizons 1/10/25, ARE-based prices. */
export const DEFAULT_PARAMS: SiteParams = {
  cO3: 50, cNO2: 15, cSO2: 1.5, cPM: 9, cCO: 250,
  precip: 1400, raindays: 140, ffd: 190, leafon: 195,
  landuse: 0.61, surface: 0.5,
  y1: 1, y2: 10, y3: 25,
  pCO2: 130, pO3: 3000, pNO2: 25000, pSO2: 15000, pPM: 250000, pCO: 1000, pRun: 2,
};

export const LANDUSE_OPTIONS = [
  { value: 0.61, key: 'lu1' },
  { value: 0.83, key: 'lu2' },
  { value: 0.38, key: 'lu3' },
] as const;

export const SURFACE_OPTIONS = [
  { value: 0.9, key: 'sf1' },
  { value: 0.5, key: 'sf2' },
  { value: 0.25, key: 'sf3' },
] as const;

export const WARN_FLAGS: ReadonlySet<FlagKey> = new Set<FlagKey>(['fUnit', 'fUnknown', 'fDbh', 'fWidth']);

/** kg O₂ per person per year (breathing needs of an adult). */
export const O2_PER_PERSON = 300;

/** Sanitise a parameter set: every field a finite number, like parseFloat(...) || 0 in the original. */
export function sanitizeParams(p: SiteParams): SiteParams {
  const out = { ...p } as Record<string, number>;
  for (const k in out) if (!Number.isFinite(out[k])) out[k] = 0;
  return out as unknown as SiteParams;
}

/** Longest allowed projection horizon in years (the per-year growth loop runs once per tree per year). */
export const MAX_HORIZON = 100;

/** Projection horizons: clamped to 1..MAX_HORIZON and de-duplicated, so totals never count a year twice. */
export function horizons(p: SiteParams): number[] {
  return [...new Set([p.y1, p.y2, p.y3].map(v => Math.min(MAX_HORIZON, Math.max(1, Math.round(v || 0)))))];
}

/** Total carbon (kg) from DBH: Chojnacky biomass × roots 1.26 × urban factor 0.8 × C fraction 0.5. */
export function carbonKg(dbh: number, grp: string): number {
  const [b0, b1] = CHOJ[grp];
  return Math.exp(b0 + b1 * Math.log(dbh)) * 1.26 * 0.8 * 0.5;
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

export const vitality = (d: number): number => d <= 10 ? 1 : d <= 25 ? 0.76 : d <= 50 ? 0.42 : d <= 75 ? 0.15 : 0;

/** Annual services for one set of dimensions (dbh cm, crown height cH m, crown diameter D m). */
export function services(
  dbh: number, cH: number, D: number, sp: SpeciesInfo, missing: number, dieback: number,
  growthOverride: number | null, h: number, p: SiteParams
): Services {
  const { la: laRaw, ground, method } = leafArea(cH, D, sp.S);
  const la = laRaw * (1 - missing / 100), lai = la / ground;
  const C = sp.palm ? carbonPalm(h) : carbonKg(dbh, sp.grp);
  const growth = growthOverride != null ? growthOverride : p.landuse * (p.ffd / 153) * vitality(dieback);
  const hGrow = 0.3 * vitality(dieback);
  const seq = sp.palm ? Math.max(0, carbonPalm(h + hGrow) - C) : Math.max(0, carbonKg(dbh + growth, sp.grp) - C);
  const o2 = seq * 32 / 12;
  const laiScale = (1 - Math.exp(-0.5 * lai)) / (1 - Math.exp(-0.5 * 4));
  const yr = 365 * 86400, leafon = p.leafon * 86400, tEff = sp.ev ? yr : (leafon + (yr - leafon) * 0.15);
  const vd: Pollutants = { O3: 0.0035, NO2: 0.0020, SO2: 0.0030, PM: 0.0005, CO: 0.00003 };
  const conc: Pollutants = { O3: p.cO3, NO2: p.cNO2, SO2: p.cSO2, PM: p.cPM, CO: p.cCO };
  const pol = {} as Pollutants;
  (Object.keys(vd) as (keyof Pollutants)[]).forEach(k => { pol[k] = vd[k] * conc[k] * 1e-6 * ground * laiScale * tEff; });
  const Pmm = p.precip, N = Math.max(1, p.raindays), pbar = Pmm / N;
  const inter = (l: number) => { const S = 0.2 * l + 0.1; return S * (1 - Math.exp(-pbar / S)) * 1.8; };
  const fLeaf = sp.ev ? 1 : Math.min(1, p.leafon / 365);
  const runoff = Math.min(N * (fLeaf * inter(lai) + (1 - fLeaf) * inter(0.5)), Pmm) / 1000 * ground * p.surface;
  const vC = seq * 3.667 / 1000 * p.pCO2;
  const vAir = pol.O3 / 1e6 * p.pO3 + pol.NO2 / 1e6 * p.pNO2 + pol.SO2 / 1e6 * p.pSO2 + pol.PM / 1e6 * p.pPM + pol.CO / 1e6 * p.pCO;
  const vRun = runoff * p.pRun;
  return { ground, la, lai, method, C, seq, o2, pol, runoff, vC, vAir, vRun, chf: vC + vAir + vRun, growth };
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
  const base = (t.base != null && !Number.isNaN(t.base) && t.base >= 0) ? t.base : Math.max(0, h * 0.35);
  if (t.base == null || Number.isNaN(t.base)) flags.push('fBase');
  const cH = Math.max(0.3, top - base);
  const wNS = t.wNS ?? NaN, wEW = t.wEW ?? NaN;
  let D = (wNS > 0 && wEW > 0) ? (wNS + wEW) / 2 : (wNS > 0 ? wNS : (wEW > 0 ? wEW : NaN));
  if (!(D > 0)) { D = Math.max(1, 0.15 * dbh + 1); flags.push('fWidth'); }
  const missing = t.missing == null || Number.isNaN(t.missing) ? 0 : t.missing;
  const dieback = t.dieback == null || Number.isNaN(t.dieback) ? 0 : t.dieback;
  const now = services(dbh, cH, D, sp, missing, dieback, null, h, p);
  if (sp.palm) flags.push('fPalm');
  if (now.method === 'beer') flags.push('fBeer');
  if (dbh > 100 && !sp.palm) flags.push('fDbh');

  // growth projection: DBH grows, height & crown follow by urban allometry, growth damps near max height
  const hmax = hmaxOf(t.species), H = horizons(p), maxY = Math.max(...H);
  const baseGrowth = p.landuse * (p.ffd / 153) * vitality(dieback);
  const snap = (y: number, s: Services, d: number, hh: number, cum: number): ProjSnapshot => ({
    y, dbh: d, h: hh, C: s.C, seq: s.seq, o2: s.o2, chf: s.chf, cum, runoff: s.runoff, polSum: polSumOf(s.pol), pol: s.pol,
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
      Dy = D * Math.pow(d / dbh, 0.7);
      cHy = Math.max(0.3, cH * Math.pow(d / dbh, 0.5));
    }
    const s = services(d, cHy, Dy, sp, missing, dieback, g, hh, p);
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

const PK: (keyof ProjTotals)[] = ['C', 'seq', 'o2', 'chf', 'cum', 'runoff', 'polSum', 'ground', 'la', 'vC', 'vAir', 'vRun', 'dbh'];

export function totals(rows: TreeResult[], params: SiteParams): Totals {
  const p = sanitizeParams(params);
  const s: Totals = {
    ground: 0, la: 0, C: 0, seq: 0, o2: 0, CO: 0, O3: 0, NO2: 0, SO2: 0, PM: 0, runoff: 0, vC: 0, vAir: 0, vRun: 0, chf: 0,
    polSum: 0, dbhSum: 0, proj: {},
  };
  const H = horizons(p);
  for (const y of H) s.proj[y] = Object.fromEntries(PK.map(k => [k, 0])) as unknown as ProjTotals;
  for (const r of rows) {
    for (const k of ['ground', 'la', 'C', 'seq', 'o2', 'runoff', 'vC', 'vAir', 'vRun', 'chf'] as const) s[k] += r[k];
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
