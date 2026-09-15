import { DbhUnit, TreeInput } from './types';

/** Parse a number with decimal comma or thousands separators; NaN when empty. */
export function num(v: unknown): number {
  if (v == null) return NaN;
  const s = String(v).trim().replace(/\s/g, '');
  if (!s) return NaN;
  const t = (s.includes(',') && !s.includes('.')) ? s.replace(',', '.') : s.replace(/,/g, '');
  return parseFloat(t);
}

const opt = (v: number): number | undefined => (Number.isNaN(v) ? undefined : v);

/**
 * Parse a pasted tree list (tab, semicolon or comma separated). Recognises a header row and maps
 * columns by name; without a header the Trees.xlsx column order is assumed.
 */
export function parseTreeList(text: string): TreeInput[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
  let rows = lines.map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, '')));
  const idx: Record<string, number> = { species: 0, id: 1, dbh: 2, height: 4, top: 5, base: 6, wNS: 7, wEW: 8, missing: 9, dieback: 10 };
  if (/name|species|art|dbh/.test(rows[0].join(' ').toLowerCase())) {
    const h = rows[0].map(c => c.toLowerCase());
    rows = rows.slice(1);
    const find = (...p: RegExp[]) => h.findIndex(c => p.some(r => r.test(c)));
    const m: Record<string, number> = {
      species: find(/species|scientif|^art|name/), id: find(/^id$|^nr|nummer/), dbh: find(/^dbh(?!.*height)(?!.*höhe)|^bhd(?!.*höhe)|stammdurch/),
      height: find(/total|baumhöhe|gesamth|^höhe|^height/), top: find(/crown top|kronenoberkante|top height/), base: find(/crown base|kronenansatz|base height/),
      wNS: find(/n\/s|\bns\b|nord/), wEW: find(/e\/w|\bew\b|\bost|o\/w/), missing: find(/missing|fehlend/), dieback: find(/dieback|absterb|totholz/),
    };
    // single crown-width / diameter column (no N/S–E/W split)
    if (m.wNS < 0 && m.wEW < 0) {
      const w = find(/crown width|crown diam|kronenbreite|kronendurchm|crown spread/);
      if (w >= 0) { m.wNS = w; m.wEW = -1; idx.wEW = -1; }
    }
    if (m.wNS >= 0 && m.wEW < 0) idx.wEW = -1;
    for (const k in m) if (m[k] >= 0) idx[k] = m[k];
  }
  const cell = (r: string[], i: number) => (i >= 0 ? r[i] : undefined);
  return rows
    .map(r => ({
      species: cell(r, idx.species) ?? '',
      id: cell(r, idx.id) || undefined,
      dbh: num(cell(r, idx.dbh)),
      height: num(cell(r, idx.height)),
      top: opt(num(cell(r, idx.top))),
      base: opt(num(cell(r, idx.base))),
      wNS: opt(num(cell(r, idx.wNS))),
      wEW: opt(num(cell(r, idx.wEW))),
      missing: opt(num(cell(r, idx.missing))),
      dieback: opt(num(cell(r, idx.dieback))),
    }))
    .filter(r => r.species && /[a-z]/i.test(r.species));
}

/** Convert the stem measure of the list to diameter in cm. */
export function applyDbhUnit(trees: TreeInput[], unit: DbhUnit): TreeInput[] {
  if (unit === 'cm') return trees;
  return trees.map(t => ({ ...t, dbh: unit === 'mm' ? t.dbh / 10 : t.dbh / Math.PI }));
}

export const SAMPLE_INPUT = `Scientific name\tID\tDBH (cm)\tDBH height (cm)\tTotal height (m)\tCrown top height (m)\tCrown base height (m)\tCrown width N/S (m)\tCrown width E/W (m)\tCrown missing (%)\tCrown dieback (%)
Pinus sylvestris\t1\t185\t130\t8\t8\t4.5\t4\t3.5\t0\t1
Pinus sylvestris\t2\t\t130
Acer palmatum\t15\t\t130`;
