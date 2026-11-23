/**
 * Compares the tree benefits calculator with i-Tree MyTree reference results.
 *
 *   npm run validate:itree
 *
 * Reads docs/validation/itree-mytree-*.json, runs every reference tree through the real calculator
 * code (src/lib/treeBenefits), writes docs/validation/report.md and exits with code 1 when a
 * metric is worse than its budget in BUDGETS below (regression guard). Goal: |deviation| ≤ 15 %.
 *
 * MyTree only takes species and DBH and estimates height and crown itself, so the calculator gets
 * the tree height from the Urban Tree Database and no crown measurements.
 */
import { build } from 'esbuild';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOAL = 0.15;
/**
 * Largest allowed median |deviation| per metric. Lower them when the calculator gets closer to
 * i-Tree; never raise them to make a change pass.
 */
const BUDGETS = { runoff: 0.3, intercept: 0.3, C: 0.15, seq: 0.2, pol: 0.35 };
const LABELS = { runoff: 'Vermiedener Abfluss', intercept: 'Regenrückhalt', C: 'Kohlenstoffspeicher', seq: 'Sequestrierung', pol: 'Schadstoffentzug' };

const entry = `
import { calcTree, DEFAULT_PARAMS } from ${JSON.stringify(join(root, 'src/lib/treeBenefits/calc.ts'))};
import { utdAllometry } from ${JSON.stringify(join(root, 'src/lib/treeBenefits/crownAllometry.ts'))};
import { PRESETS, applyPresetToParams } from ${JSON.stringify(join(root, 'src/lib/treeBenefits/presets.ts'))};
export { calcTree, DEFAULT_PARAMS, utdAllometry, PRESETS, applyPresetToParams };
`;
const tmp = mkdtempSync(join(tmpdir(), 'tb-validate-'));
const out = join(tmp, 'calc.mjs');
await build({ stdin: { contents: entry, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
const { calcTree, DEFAULT_PARAMS, utdAllometry, PRESETS, applyPresetToParams } = await import(pathToFileURL(out).href);
rmSync(tmp, { recursive: true, force: true });

// MyTree location name (canton-level data) -> calculator preset
const PLACE_TO_PRESET = [
  ['Rapperswil', 'rapperswil'], ['Zürich', 'zuerich'], ['Zurich', 'zuerich'], ['Winterthur', 'winterthur'], ['St. Gallen', 'stgallen'],
  ['Lucerne', 'luzern'], ['Luzern', 'luzern'], ['Basel', 'basel'], ['Bern', 'bern'], ['Chur', 'chur'], ['Lausanne', 'lausanne'],
  ['Geneva', 'genf'], ['Genève', 'genf'], ['Lugano', 'lugano'], ['Davos', 'davos'], ['Milan', 'milano'],
];
const presetFor = loc => {
  const hit = PLACE_TO_PRESET.find(([name]) => loc.startsWith(name));
  return hit && PRESETS.find(p => p.id === hit[1]);
};

const dir = join(root, 'docs/validation');
const trees = Object.assign({}, ...readdirSync(dir).filter(f => /^itree-mytree-.*\.json$/.test(f))
  .map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')).trees));

const rows = [];
for (const [id, t] of Object.entries(trees)) {
  const preset = presetFor(t.location || '');
  if (!preset) { console.warn(`übersprungen (kein Standort): ${id}`); continue; }
  const params = applyPresetToParams({ ...DEFAULT_PARAMS }, preset);
  const height = utdAllometry(t.species)?.predict('h', t.dbh) ?? Math.max(3, 0.25 * t.dbh + 3);
  const r = calcTree({ species: t.species, dbh: t.dbh, height }, params);
  const polEA = r.pol.CO + r.pol.O3 + r.pol.NO2 + r.pol.SO2 + r.pol.PM;
  const polIT = t.CO + t.O3 + t.NO2 + t.SO2 + t.PM;
  rows.push({
    id, species: t.species, dbh: t.dbh, site: preset.name,
    dev: {
      runoff: r.runoff * 1000 / t.runoffL - 1, intercept: r.intercept * 1000 / t.interceptL - 1,
      C: r.C / t.storageC - 1, seq: r.seq / t.seqC - 1, pol: polEA / polIT - 1,
    },
  });
}

const median = v => { const s = [...v].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = d => `${d >= 0 ? '+' : ''}${Math.round(d * 100)} %`;
const lamp = d => (Math.abs(d) <= GOAL ? '🟢' : Math.abs(d) <= 2 * GOAL ? '🟡' : '🔴');

const summary = Object.keys(BUDGETS).map(k => {
  const v = rows.map(r => r.dev[k]);
  const medAbs = median(v.map(Math.abs));
  return { k, med: median(v), medAbs, within: v.filter(x => Math.abs(x) <= GOAL).length, ok: medAbs <= BUDGETS[k] };
});

const md = [
  '# Baumleistungen: Vergleich mit i-Tree MyTree',
  '',
  `Automatisch erzeugt von \`npm run validate:itree\`. Ziel: Abweichung höchstens ${GOAL * 100} % (🟢 ≤ 15 %, 🟡 ≤ 30 %, 🔴 > 30 %).`,
  'Referenz: i-Tree MyTree, synthetische Testbäume, Zustand gut, volle Sonne. Höhe für den Rechner aus der Urban Tree Database, Krone nicht gemessen.',
  '',
  '## Zusammenfassung',
  '',
  '| Kennzahl | Median | Median der Beträge | innerhalb ±15 % | Budget | Status |',
  '|---|---|---|---|---|---|',
  ...summary.map(s => `| ${LABELS[s.k]} | ${pct(s.med)} | ${pct(s.medAbs)} | ${s.within}/${rows.length} | ${pct(BUDGETS[s.k])} | ${s.ok ? 'ok' : '**überschritten**'} |`),
  '',
  '## Je Baum',
  '',
  '| Test | Art | DBH cm | Standort | Abfluss | Regenrückhalt | Speicher | Sequestrierung | Schadstoffe |',
  '|---|---|---|---|---|---|---|---|---|',
  ...rows.map(r => `| ${r.id} | *${r.species}* | ${r.dbh} | ${r.site} | ${['runoff', 'intercept', 'C', 'seq', 'pol'].map(k => `${lamp(r.dev[k])} ${pct(r.dev[k])}`).join(' | ')} |`),
  '',
];
writeFileSync(join(dir, 'report.md'), md.join('\n'));

console.log(`${rows.length} Referenzbäume`);
for (const s of summary) console.log(`${LABELS[s.k].padEnd(20)} Median ${pct(s.med).padStart(7)} | Median der Beträge ${pct(s.medAbs).padStart(6)} | innerhalb ±15 %: ${String(s.within).padStart(2)}/${rows.length} | Budget ${pct(BUDGETS[s.k])} ${s.ok ? 'ok' : 'ÜBERSCHRITTEN'}`);
console.log('Bericht: docs/validation/report.md');
if (summary.some(s => !s.ok)) process.exit(1);
