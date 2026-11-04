import { horizons, totals } from './calc';
import { TFn, fmt } from './i18n';
import { Lang, SiteParams, TreeResult } from './types';

export interface ColDef {
  /** i18n key, or raw label when raw is set */
  k: string;
  raw?: boolean;
  /** text column (left aligned) */
  t?: boolean;
  /** unit shown under the header */
  u?: string;
  /** group header i18n key (starts a group) */
  g?: string;
  /** raw group header (projection year) */
  gRaw?: string;
  /** column kind for rendering */
  kind?: 'flags' | 'type' | 'class';
}

/** Column definitions of the results table; hasClass adds the size-class column after the type. */
export function columns(T: TFn, lang: Lang, p: SiteParams, hasClass: boolean): ColDef[] {
  const a = lang === 'de' ? 'a' : 'yr';
  const base: ColDef[] = [
    { k: 'hSpecies', t: true, g: 'gTree' }, { k: 'hId', t: true }, { k: 'hType', t: true, kind: 'type' },
  ];
  if (hasClass) base.push({ k: 'hSize', t: true, kind: 'class' });
  base.push(
    { k: 'hDbh', u: 'cm' }, { k: 'hH', u: 'm' }, { k: 'hGround', u: 'm²' }, { k: 'hLA', u: 'm²' }, { k: 'hLAI' },
    { k: 'hC', u: 'kg', g: 'gCarbon' }, { k: 'hSeq', u: 'kg/' + a }, { k: 'hO2', u: 'kg/' + a },
    { k: 'CO', raw: true, g: 'gAirG' }, { k: 'O₃', raw: true }, { k: 'NO₂', raw: true }, { k: 'SO₂', raw: true }, { k: 'PM₂.₅', raw: true },
    { k: 'hRun', u: 'm³/' + a, g: 'gWater' }, { k: 'hVal', u: 'CHF/' + a, g: 'gValue' },
  );
  for (const y of horizons(p)) base.push({ k: 'pDbh', u: 'cm', gRaw: T('gProjT', y) }, { k: 'pC', u: 'kg' }, { k: 'pChf', u: 'CHF/' + a }, { k: 'pCum', u: 'CHF' });
  base.push({ k: 'hFlags', t: true, kind: 'flags' });
  return base;
}

export const colLabel = (c: ColDef, T: TFn): string => (c.raw ? c.k : T(c.k));

/** Formatted cell values of one tree row, in column order. */
export function rowValues(r: TreeResult, T: TFn, lang: Lang, p: SiteParams, hasClass: boolean): string[] {
  const f = (v: number, d = 1) => fmt(lang, v, d);
  const v: string[] = [r.species, r.id ?? '', T(r.sp.ev ? 'ev' : 'dec')];
  if (hasClass) v.push(r.sizeClass ? T(r.sizeClass) : '');
  v.push(f(r.dbh), f(r.height), f(r.ground), f(r.la), f(r.lai, 2), f(r.C), f(r.seq, 2), f(r.o2, 2),
    f(r.pol.CO, 2), f(r.pol.O3), f(r.pol.NO2), f(r.pol.SO2), f(r.pol.PM, 2), f(r.runoff, 2), f(r.chf, 2));
  for (const y of horizons(p)) { const q = r.proj[y]; v.push(f(q.dbh, 1), f(q.C), f(q.chf, 2), f(q.cum)); }
  v.push(r.flags.map(k => T(k)).join('; '));
  return v;
}

/** Formatted total row, in column order. */
export function totalValues(rows: TreeResult[], T: TFn, lang: Lang, p: SiteParams, hasClass: boolean): string[] {
  const s = totals(rows, p);
  const f = (v: number, d = 1) => fmt(lang, v, d);
  const v: string[] = [T('sum', rows.length), '', ''];
  if (hasClass) v.push('');
  v.push('', '', f(s.ground), f(s.la), '', f(s.C), f(s.seq, 2), f(s.o2, 2), f(s.CO, 2), f(s.O3), f(s.NO2), f(s.SO2), f(s.PM, 2), f(s.runoff, 2), f(s.chf, 2));
  for (const y of horizons(p)) { const q = s.proj[y]; v.push('', f(q.C), f(q.chf, 2), f(q.cum)); }
  v.push('');
  return v;
}

/** Tab separated text for pasting into Excel: header with year prefixes, one row per tree, total row. */
export function buildExcelText(rows: TreeResult[], T: TFn, lang: Lang, p: SiteParams, hasClass: boolean): string {
  const C = columns(T, lang, p, hasClass);
  const de = (v: string) => v.replace(/'|'/g, '');
  let curG = '';
  const head = C.map(c => {
    if (c.gRaw) curG = c.gRaw; else if (c.g || c.t) curG = '';
    const nm = colLabel(c, T) + (c.u ? ` (${c.u})` : '');
    return curG && !c.gRaw ? curG + ' ' + nm : (c.gRaw ? c.gRaw + ' ' + nm : nm);
  }).join('\t');
  const lines = [head, ...rows.map(r => rowValues(r, T, lang, p, hasClass).map(de).join('\t')), totalValues(rows, T, lang, p, hasClass).map(de).join('\t')];
  return lines.join('\n');
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  }
}
