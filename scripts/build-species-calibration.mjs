/**
 * Builds src/lib/treeBenefits/speciesCalibration.ts: one correction per species so that the
 * calculator matches i-Tree MyTree for the trees of the academy.
 *
 *   node scripts/build-species-calibration.mjs
 *
 * Input: docs/validation/itree-mytree-academy-*.json (MyTree runs, one or two DBHs per species,
 * crown not measured). For every species, in this order and each with the earlier ones applied:
 *   c   carbon storage factor exp(a + b · ln(DBH/30)), least squares on ln(i-Tree / calculator)
 *   g   diameter growth multiplier so that the sequestration matches (geometric mean over the DBHs,
 *       without runs where MyTree has stopped the growth because the tree is above its size limit)
 *   crown  crown size factor exp(a + b · ln(DBH/30)) on crown and leaf area (same leaf area index)
 *       so that the rain interception matches; only for crowns that were not measured
 * Species measured at one DBH only get the median DBH slope of the others (conifers and broadleaves apart). Genera with at least two
 * calibrated species get the median of their species as fallback.
 */
import { build } from 'esbuild';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lib = f => JSON.stringify(join(root, 'src/lib/treeBenefits', f));
const entry = `
import { calcTree, DEFAULT_PARAMS } from ${lib('calc.ts')};
import { utdAllometry } from ${lib('crownAllometry.ts')};
import { PRESETS, applyPresetToParams } from ${lib('presets.ts')};
import { normName } from ${lib('species.ts')};
import { CAL_SPECIES, CAL_GENUS } from ${lib('speciesCalibration.ts')};
export { calcTree, DEFAULT_PARAMS, utdAllometry, PRESETS, applyPresetToParams, normName, CAL_SPECIES, CAL_GENUS };
`;
const tmp = mkdtempSync(join(tmpdir(), 'tb-cal-'));
const out = join(tmp, 'calc.mjs');
await build({ stdin: { contents: entry, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
const M = await import(pathToFileURL(out).href);
rmSync(tmp, { recursive: true, force: true });

// start from no correction at all (the bundled table is the one being replaced)
for (const k of Object.keys(M.CAL_SPECIES)) delete M.CAL_SPECIES[k];
for (const k of Object.keys(M.CAL_GENUS)) delete M.CAL_GENUS[k];

/** Academy names that MyTree lists under another name (same tree, so same correction). */
const ALIASES = {
  'platanus x acerifolia': 'platanus x hybrida', 'platanus x hispanica': 'platanus x hybrida',
  'aria edulis': 'sorbus aria', 'cormus domestica': 'sorbus domestica', 'torminalis glaberrima': 'sorbus torminalis',
};

const dir = join(root, 'docs/validation');
const runs = readdirSync(dir).filter(f => /^itree-mytree-academy-.*\.json$/.test(f))
  .flatMap(f => Object.values(JSON.parse(readFileSync(join(dir, f), 'utf8')).trees));
const rap = M.PRESETS.find(p => p.id === 'rapperswil');
const params = M.applyPresetToParams({ ...M.DEFAULT_PARAMS }, rap);
const calc = t => {
  const height = M.utdAllometry(t.species)?.predict('h', t.dbh) ?? Math.max(3, 0.25 * t.dbh + 3);
  return M.calcTree({ species: t.species, dbh: t.dbh, height }, params);
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r3 = v => Math.round(v * 1000) / 1000;
/**
 * Least squares of y = a + b·x on x = ln(DBH/30), y = ln(ratio). With a single DBH the slope is
 * bDefault (median of the species measured at two DBHs) and only a is fitted.
 */
function fitAB(pts, aMax, bMax, bDefault = 0) {
  const P = pts.filter(([, r]) => Number.isFinite(r) && r > 0).map(([d, r]) => [Math.log(d / 30), Math.log(r)]);
  if (!P.length) return undefined;
  const mx = P.reduce((s, [x]) => s + x, 0) / P.length, my = P.reduce((s, [, y]) => s + y, 0) / P.length;
  const vx = P.reduce((s, [x]) => s + (x - mx) ** 2, 0);
  const b = vx > 1e-9 ? clamp(P.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / vx, -bMax, bMax) : bDefault;
  const a = clamp(P.reduce((s, [x, y]) => s + y - b * x, 0) / P.length, -aMax, aMax);
  return [r3(a), r3(b)];
}
const geomean = v => Math.exp(v.reduce((s, x) => s + Math.log(x), 0) / v.length);

const bySpecies = new Map();
for (const t of runs) {
  if (t.storageC == null || t.interceptL == null) continue;
  const key = M.normName(t.species).spKey;
  bySpecies.set(key, [...(bySpecies.get(key) || []), t]);
}

const median = v => { const s = [...v].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
// species with two DBHs first: their median slopes are used for the species with one DBH
const twoDbh = ts => new Set(ts.map(t => t.dbh)).size > 1;
const order = [...bySpecies].sort(([a, x], [b, y]) => (twoDbh(y) - twoDbh(x)) || (a < b ? -1 : 1));
// conifers and broadleaves differ in how MyTree's crown grows with DBH
const groupOf = ts => (ts[0].form === 'conifer' ? 'conifer' : 'broadleaf');
const slopes = { conifer: { c: 0, crown: 0 }, broadleaf: { c: 0, crown: 0 } };
let slopesSet = false;
for (const [key, ts] of order) {
  if (!twoDbh(ts) && !slopesSet) {
    for (const [grp, sl] of Object.entries(slopes)) {
      const fitted = [...bySpecies].filter(([k, t]) => twoDbh(t) && groupOf(t) === grp).map(([k]) => M.CAL_SPECIES[k]);
      if (fitted.length) for (const k of Object.keys(sl)) sl[k] = r3(median(fitted.map(c => c[k][1])));
    }
    slopesSet = true;
  }
  const slope = slopes[groupOf(ts)];
  const cal = {};
  M.CAL_SPECIES[key] = cal;
  cal.c = fitAB(ts.map(t => [t.dbh, t.storageC / calc(t).C]), Math.log(3), 1, slope.c);
  // MyTree nearly stops the growth of some medium-sized species above a size limit (sequestration
  // at the larger DBH below 30 % of the smaller one); those runs would drag the growth of the whole
  // species down, so they are left out here and listed in the report.
  const small = Math.min(...ts.map(t => t.dbh));
  const seqRef = ts.find(t => t.dbh === small).seqC;
  const growing = ts.filter(t => t.dbh === small || t.seqC >= 0.3 * seqRef);
  let g = 1;
  for (let i = 0; i < 6; i++) {
    cal.g = g;
    const r = growing.map(t => t.seqC / calc(t).seq).filter(x => Number.isFinite(x) && x > 0);
    if (!r.length) break;
    g = clamp(g * geomean(r), 0.25, 4);
  }
  cal.g = r3(g);
  // crown: bisection on ln(factor) per run until the interception matches
  const laPts = ts.map(t => {
    let lo = -2.3, hi = 2.3;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      cal.crown = [mid, 0];
      if (calc(t).intercept * 1000 < t.interceptL) lo = mid; else hi = mid;
    }
    return [t.dbh, Math.exp((lo + hi) / 2)];
  });
  cal.crown = fitAB(laPts, 2.3, 1.5, slope.crown);
}

// genus fallback: median of the calibrated species
const byGenus = new Map();
for (const [key, cal] of Object.entries(M.CAL_SPECIES)) byGenus.set(key.split(' ')[0], [...(byGenus.get(key.split(' ')[0]) || []), cal]);
const genus = {};
for (const [g, cals] of [...byGenus].sort()) {
  if (cals.length < 2) continue;
  const ab = k => [r3(median(cals.map(c => c[k][0]))), r3(median(cals.map(c => c[k][1])))];
  genus[g] = { c: ab('c'), g: r3(median(cals.map(c => c.g))), crown: ab('crown') };
}
const species = { ...M.CAL_SPECIES };
for (const [alias, name] of Object.entries(ALIASES)) if (species[name]) species[alias] = species[name];

const key = k => (/^[a-z]+$/.test(k) ? k : `'${k}'`);
const line = ([k, c]) => `  ${key(k)}: { c: [${c.c}], g: ${c.g}, crown: [${c.crown}] },`;
const ts = [
  '// Generated by scripts/build-species-calibration.mjs from docs/validation/itree-mytree-academy-*.json.',
  '// Do not edit by hand.',
  "import type { SpeciesCal } from './types';",
  '',
  `/** Correction to i-Tree MyTree per species (${bySpecies.size} species, ${runs.length} MyTree runs, Rapperswil-Jona). */`,
  'export const CAL_SPECIES: Record<string, SpeciesCal> = {',
  ...Object.entries(species).sort().map(line),
  '};',
  '',
  '/** Median of the calibrated species of a genus, for species MyTree does not know. */',
  'export const CAL_GENUS: Record<string, SpeciesCal> = {',
  ...Object.entries(genus).map(line),
  '};',
  '',
];
writeFileSync(join(root, 'src/lib/treeBenefits/speciesCalibration.ts'), ts.join('\n'));
console.log(`${bySpecies.size} Arten, ${Object.keys(genus).length} Gattungen aus ${runs.length} MyTree-Läufen -> src/lib/treeBenefits/speciesCalibration.ts`);
for (const [grp, sl] of Object.entries(slopes)) console.log(`Steigung für Arten mit nur einem DBH (${grp}): Speicher ${sl.c}, Krone ${sl.crown}`);
