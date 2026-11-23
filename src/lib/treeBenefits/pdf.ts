import jsPDF from 'jspdf';
import autoTable, { UserOptions, CellHookData } from 'jspdf-autotable';
import { ChartConfiguration } from 'chart.js';
import { horizons, totals, seriesTotal, polSumOf, O2_PER_PERSON, LANDUSE_OPTIONS } from './calc';
import { HEX, chartToImage, projectionChartConfig, oxygenChartConfig } from './charts';
import { makeT, pdfStrings, locale } from './i18n';
import { Lang, SiteParams, SiteInfo, TreeResult, TreeInput, SizeClassKey, SizeClassStandard } from './types';
import { SIZE_CLASS_KEYS } from './sizeClasses';

import { applyBrandFonts } from '../pdfFonts';
export interface PdfInput {
  rows: TreeResult[];
  skipped: TreeInput[];
  params: SiteParams;
  site: SiteInfo;
  lang: Lang;
  /** Size class standards, when trees came from a project selection */
  sizeClasses?: Record<SizeClassKey, SizeClassStandard>;
  projectName?: string;
}

const rgb = (h: string): [number, number, number] => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];

/** Build the multi-page tree benefits report. */
export function buildTreeBenefitsPdf(input: PdfInput): jsPDF {
  const { rows, skipped, params: p, site, lang } = input;
  const T = makeT(lang), Pt = pdfStrings(lang);
  const pf = (v: number, d = 0) => Number.isFinite(v) ? v.toLocaleString(locale(lang), { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/['']/g, "'") : '-';
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  applyBrandFonts(doc); // fonts are preloaded by the caller (preloadBrandFonts)
  const s = totals(rows, p), n = rows.length;
  const W = 210, M = 16, CW = W - 2 * M;
  const de = lang === 'de', a = de ? 'a' : 'yr';
  const today = new Date().toLocaleDateString(locale(lang), { day: 'numeric', month: 'long', year: 'numeric' });
  const hasClass = rows.some(r => r.sizeClass);
  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  const H = (size: number, style: 'normal' | 'bold' = 'normal', color = HEX.ink) => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...rgb(color)); };
  const hdrBand = (title: string, sub: string) => {
    doc.setFillColor(...rgb(HEX.green)); doc.rect(0, 0, W, 30, 'F');
    H(19, 'bold', '#FFFFFF'); doc.text(title, M, 14); H(9.5, 'normal', '#bbf7d0'); doc.text(sub, M, 21);
    H(9, 'bold', '#FFFFFF'); doc.text(Pt.by, W - M, 12, { align: 'right' }); H(8, 'normal', '#bbf7d0'); doc.text(`${Pt.date} ${today}`, W - M, 18, { align: 'right' });
  };
  const sectionTitle = (t: string, y: number) => { H(12, 'bold', HEX.green); doc.text(t, M, y); doc.setDrawColor(...rgb(HEX.line)); doc.setLineWidth(0.3); doc.line(M, y + 2, W - M, y + 2); return y + 9; };
  const baseParse = (d: CellHookData) => {
    if (d.section === 'body' && d.row.index === d.table.body.length - 1) { d.cell.styles.fontStyle = 'bold'; d.cell.styles.fillColor = rgb(HEX.soft); }
    if (d.section === 'head' && d.column.index === 0) d.cell.styles.halign = 'left';
  };
  const tblStyle: UserOptions = {
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8, textColor: rgb(HEX.ink), lineColor: rgb(HEX.line), lineWidth: 0 },
    headStyles: { fillColor: rgb(HEX.soft), textColor: rgb(HEX.green), fontStyle: 'bold', fontSize: 7.5, halign: 'right' },
    bodyStyles: { halign: 'right' }, alternateRowStyles: { fillColor: [247, 249, 244] },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    didParseCell: baseParse,
  };
  const img = (cfg: ChartConfiguration, w: number, h: number) => chartToImage(cfg, w, h);
  const siteLine = `${de ? 'Standort' : 'Site'}: ${site.name}, ${site.elev} m${site.src === 'live' ? (de ? ' (Live-Daten Open-Meteo/CAMS)' : ' (live data Open-Meteo/CAMS)') : ''}`;

  // ---- Page 1: overview
  hdrBand(Pt.report, input.projectName ? `${input.projectName} · ${T('subtitle')}` : T('subtitle'));
  H(9, 'normal', HEX.muted); doc.text(siteLine, M, 38); doc.text(Pt.method, M, 43);
  let y = sectionTitle(Pt.overview, 54);
  const polSum = s.polSum;
  const kpis: [string, string, string][] = [
    [Pt.trees, String(n), `${skipped.length} ${T('kSkip')}`], [Pt.storage, pf(s.C), Pt.storageU], [Pt.seq, pf(s.seq, 1), Pt.seqU],
    [Pt.o2, pf(s.o2, 1), `${Pt.o2U} · ${T('kO2S', pf(s.o2 / O2_PER_PERSON, 1)).replace('≈', '~')}`],
    [Pt.pol, pf(polSum), Pt.polU], [Pt.run, pf(s.runoff, 1), `${Pt.runU} · ${Pt.intercept} ${pf(s.intercept)} m³`], [Pt.value, 'CHF ' + pf(s.chf), Pt.valueU],
  ];
  const bw = (CW - 3 * 4) / 4, bh = 21;
  kpis.forEach((k, i) => {
    const x = M + (i % 4) * (bw + 4), yy = y + Math.floor(i / 4) * (bh + 4), hl = i === 7 || i === 3;
    doc.setFillColor(...rgb(hl ? HEX.soft : '#FFFFFF')); doc.setDrawColor(...rgb(hl ? HEX.green : HEX.line)); doc.setLineWidth(0.3); doc.roundedRect(x, yy, bw, bh, 1.5, 1.5, 'FD');
    H(6.2, 'bold', HEX.muted); doc.text(k[0].toUpperCase(), x + 3, yy + 6); H(12.5, 'bold', hl ? HEX.green : HEX.ink); doc.text(k[1], x + 3, yy + 13.5);
    H(6.3, 'normal', HEX.muted); doc.text(doc.splitTextToSize(k[2], bw - 6)[0], x + 3, yy + 18.3);
  });
  y += 2 * bh + 4 + 4;
  H(8, 'normal', HEX.muted); doc.text(`${Pt.storageValue}: CHF ${pf(s.C * 3.667 / 1000 * p.pCO2)}  (${pf(s.C * 3.667 / 1000, 2)} t CO2 × ${pf(p.pCO2)} CHF/t)`, M, y); y += 8;

  // Horizon table
  const HZ = horizons(p), yrLbl = (yv: number) => T('yr', yv);
  y = sectionTitle(T('projTitle'), y);
  const col = (k: string): string[] => {
    const todayV = k === 'dbh' ? pf(s.dbhSum / n, 1) : k === 'C' ? pf(s.C) : k === 'seq' ? pf(s.seq, 1) : k === 'o2' ? pf(s.o2, 1) : k === 'pers' ? pf(s.o2 / O2_PER_PERSON, 1)
      : k === 'polSum' ? pf(s.polSum) : k === 'runoff' ? pf(s.runoff, 1) : k === 'intercept' ? pf(s.intercept) : k === 'ground' ? pf(s.ground) : k === 'chf' ? pf(s.chf) : '–';
    return [todayV, ...HZ.map(h => {
      const q = s.proj[h] as unknown as Record<string, number>;
      return k === 'dbh' ? pf(q.dbh / n, 1) : k === 'pers' ? pf(q.o2 / O2_PER_PERSON, 1) : k === 'cum' ? pf(q.cum) : (k === 'seq' || k === 'runoff' || k === 'o2') ? pf(q[k], 1) : pf(q[k]);
    })];
  };
  const hzRows = [
    [de ? 'Ø Stammdurchmesser cm' : 'Mean DBH cm', ...col('dbh')],
    [`${Pt.storage} kg C`, ...col('C')],
    [`${Pt.seq} kg C/${a}`, ...col('seq')],
    [`${Pt.o2} kg/${a}`, ...col('o2')],
    [de ? 'Atembedarf Personen (300 kg O2/a)' : 'People supplied (300 kg O2/yr)', ...col('pers')],
    [`${Pt.pol} g/${a}`, ...col('polSum')],
    [`${Pt.intercept} m³/${a}`, ...col('intercept')],
    [`${Pt.run} m³/${a}`, ...col('runoff')],
    [`${Pt.value} CHF/${a}`, ...col('chf')],
    [`${T('pCum')} CHF`, '–', ...HZ.map(h => pf(s.proj[h].cum))],
  ];
  autoTable(doc, {
    ...tblStyle, startY: y, margin: { left: M, right: M }, head: [['', de ? 'Heute' : 'Today', ...HZ.map(yrLbl)]], body: hzRows,
    columnStyles: { 0: { halign: 'left', fontStyle: 'normal', textColor: rgb(HEX.muted) } },
    didParseCell: d => {
      if (d.section === 'body' && d.row.index >= hzRows.length - 2) d.cell.styles.fontStyle = 'bold';
      if (d.section === 'body' && (d.row.index === 4 || d.row.index === 5)) d.cell.styles.fillColor = rgb(HEX.soft);
      if (d.section === 'head' && d.column.index === 0) d.cell.styles.halign = 'left';
    },
  });
  y = lastY() + 10;

  // Charts row: value split + pollutants
  const cy = sectionTitle(Pt.valueSplit + '  ·  ' + Pt.polByType, y);
  const donutCfg: ChartConfiguration<'doughnut'> = { type: 'doughnut', data: { labels: [Pt.cSeq, Pt.air, Pt.runoff], datasets: [{ data: [s.vC, s.vAir, s.vRun], backgroundColor: [HEX.green, HEX.air, HEX.water], borderWidth: 0 }] },
    options: { cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, font: { size: 11 } } } } } };
  const donut = img(donutCfg as unknown as ChartConfiguration, 420, 300);
  const bars = img({ type: 'bar', data: { labels: ['O3', 'NO2', 'SO2', 'PM2.5', 'CO'], datasets: [{ data: [s.O3, s.NO2, s.SO2, s.PM, s.CO], backgroundColor: HEX.air, borderRadius: 3 }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 11 } } }, y: { grid: { color: HEX.line }, ticks: { font: { size: 10 } }, title: { display: true, text: 'g / ' + (de ? 'Jahr' : 'yr'), font: { size: 10 } } } } } }, 520, 300);
  doc.addImage(donut, 'JPEG', M, cy, CW * 0.42, CW * 0.42 * 300 / 420); doc.addImage(bars, 'JPEG', M + CW * 0.46, cy, CW * 0.54, CW * 0.54 * 300 / 520);
  y = cy + CW * 0.42 * 300 / 420 + 6;
  H(8, 'normal', HEX.muted); doc.text(`${Pt.cSeq} CHF ${pf(s.vC)}  ·  ${Pt.air} CHF ${pf(s.vAir)}  ·  ${Pt.runoff} CHF ${pf(s.vRun)}`, M, y);

  // ---- Charts page
  doc.addPage('a4', 'portrait');
  hdrBand(de ? 'Leistungen im Zeitverlauf' : 'Services over time', T('title'));
  const ser = seriesTotal(rows, p), lbl = ser.map(x => x.y), mark = ser.map(x => (HZ.includes(x.y) ? 4 : 0));
  const line = (label: string, key: string, color: string, axis: string, dash?: boolean) => ({
    label, data: ser.map(x => +((x as unknown as Record<string, number>)[key]).toFixed(2)), borderColor: color, backgroundColor: color + '22', fill: !dash, tension: 0.25,
    pointRadius: mark, pointBackgroundColor: color, yAxisID: axis, borderDash: dash ? [5, 4] : undefined,
  });
  const sc = (t1: string, t2: string) => ({
    x: { title: { display: true, text: T('chartX'), font: { size: 10 } }, grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 11 } },
    y: { position: 'left' as const, title: { display: true, text: t1, font: { size: 10 } }, grid: { color: HEX.line }, ticks: { font: { size: 10 } } },
    y2: { position: 'right' as const, title: { display: true, text: t2, font: { size: 10 } }, grid: { display: false }, ticks: { font: { size: 10 } } },
  });
  const legend = { position: 'bottom' as const, labels: { boxWidth: 10, boxHeight: 10, font: { size: 10 } } };
  const cw = (CW - 6) / 2, ch = cw * 300 / 460;
  const hzLabels = [de ? 'Heute' : 'Today', ...HZ.map(yrLbl)];
  const pick = (k: 'vC' | 'vAir' | 'vRun') => [s[k], ...HZ.map(h => s.proj[h][k])];
  const stacked = img({ type: 'bar', data: { labels: hzLabels, datasets: [{ label: Pt.cSeq, data: pick('vC'), backgroundColor: HEX.green }, { label: Pt.air, data: pick('vAir'), backgroundColor: HEX.air }, { label: Pt.runoff, data: pick('vRun'), backgroundColor: HEX.water }] },
    options: { plugins: { legend }, scales: { x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } }, y: { stacked: true, grid: { color: HEX.line }, ticks: { font: { size: 10 } }, title: { display: true, text: `CHF/${a}`, font: { size: 10 } } } } } }, 460, 300);
  const rp = img({ type: 'line', data: { labels: lbl, datasets: [line(`${Pt.run} m³/${a}`, 'runoff', HEX.water, 'y'), line(`${Pt.pol} g/${a}`, 'polSum', HEX.air, 'y2', true)] }, options: { plugins: { legend }, scales: sc(`m³/${a}`, `g/${a}`) } }, 460, 300);
  const sq = img({ type: 'line', data: { labels: lbl, datasets: [line(`${Pt.seq} kg C/${a}`, 'seq', HEX.o2, 'y'), line(`${Pt.storage} kg C`, 'C', HEX.green, 'y2', true)] }, options: { plugins: { legend }, scales: sc(`kg C/${a}`, 'kg C') } }, 460, 300);
  const cap = (t: string, x: number, yy: number) => { H(9, 'bold', HEX.green); doc.text(t, x, yy); };
  let gy = 42;
  cap(de ? 'Jahreswert nach Leistung' : 'Annual value by service', M, gy); doc.addImage(stacked, 'JPEG', M, gy + 3, cw, ch);
  cap(de ? 'Abfluss und Schadstoffentzug' : 'Runoff and pollution removal', M + cw + 6, gy); doc.addImage(rp, 'JPEG', M + cw + 6, gy + 3, cw, ch);
  gy += ch + 14;
  cap(de ? 'Sequestrierung und Speicher' : 'Sequestration and storage', M, gy); doc.addImage(sq, 'JPEG', M, gy + 3, cw, ch);
  gy += ch + 14;
  const o2img = img(oxygenChartConfig(rows, p, T, lang, true), 900, 320);
  cap(de ? 'Sauerstoffproduktion und versorgte Personen' : 'Oxygen production and people supplied', M, gy); doc.addImage(o2img, 'JPEG', M, gy + 3, CW, CW * 320 / 900);
  gy += CW * 320 / 900 + 8;
  H(7.5, 'normal', HEX.muted); doc.text(doc.splitTextToSize(T('o2Note').replace(/₂/g, '2'), CW), M, gy, { lineHeightFactor: 1.4 });

  // ---- Species page
  doc.addPage('a4', 'portrait'); hdrBand(Pt.bySpecies, T('title')); y = 40;
  const bySpV: Record<string, number> = {};
  for (const r of rows) bySpV[r.species] = (bySpV[r.species] || 0) + r.chf;
  const topSp = Object.entries(bySpV).sort((x, z) => z[1] - x[1]).slice(0, 12);
  const spBarH = Math.max(220, 40 + topSp.length * 24);
  const spBar = img({ type: 'bar', data: { labels: topSp.map(x => x[0]), datasets: [{ data: topSp.map(x => +x[1].toFixed(2)), backgroundColor: HEX.green, borderRadius: 3 }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: HEX.line }, ticks: { font: { size: 10 } }, title: { display: true, text: `CHF/${a}`, font: { size: 10 } } }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } } } }, 940, spBarH);
  const spH = Math.min(CW * spBarH / 940, 90);
  cap(de ? 'Jahreswert nach Art (heute)' : 'Annual value by species (today)', M, y); doc.addImage(spBar, 'JPEG', M, y + 3, CW, spH); y += spH + 12;
  const bySp: Record<string, { n: number; C: number; seq: number; pol: number; run: number; chf: number }> = {};
  for (const r of rows) {
    const b = bySp[r.species] = bySp[r.species] || { n: 0, C: 0, seq: 0, pol: 0, run: 0, chf: 0 };
    b.n++; b.C += r.C; b.seq += r.seq; b.pol += polSumOf(r.pol); b.run += r.runoff; b.chf += r.chf;
  }
  const spRows = Object.entries(bySp).sort((x, z) => z[1].chf - x[1].chf).map(([k, b]) => [k, String(b.n), pf(b.C), pf(b.seq, 1), pf(b.pol), pf(b.run, 1), pf(b.chf)]);
  spRows.push([Pt.total, String(n), pf(s.C), pf(s.seq, 1), pf(polSum), pf(s.runoff, 1), pf(s.chf)]);
  autoTable(doc, { ...tblStyle, startY: y, margin: { left: M, right: M }, head: [[Pt.species, Pt.count, `${Pt.storage} ${Pt.storageU}`, `${Pt.seq} ${Pt.seqU}`, `${Pt.pol} ${Pt.polU}`, `${Pt.run} ${Pt.runU}`, `${Pt.value} ${Pt.valueU}`]], body: spRows });

  // ---- Per-tree table (landscape)
  doc.addPage('a4', 'landscape');
  const LW = 297;
  doc.setFillColor(...rgb(HEX.green)); doc.rect(0, 0, LW, 14, 'F'); H(11, 'bold', '#FFFFFF'); doc.text(Pt.perTree, M, 9.5); H(8, 'normal', '#bbf7d0'); doc.text(`${T('title')} · ${today}`, LW - M, 9.5, { align: 'right' });
  const hdr = [...Pt.hdr]; if (hasClass) hdr.splice(3, 0, Pt.sizeClass);
  const body = rows.map(r => {
    const v = [r.species, r.id ?? '', r.sp.ev ? Pt.ev : Pt.dec];
    if (hasClass) v.push(r.sizeClass ? T(r.sizeClass) : '');
    v.push(pf(r.dbh, 1), pf(r.height, 1), pf(r.lai, 2), pf(r.C), pf(r.seq, 2), pf(r.o2, 2), pf(r.pol.CO, 2), pf(r.pol.O3, 1), pf(r.pol.NO2, 1), pf(r.pol.SO2, 1), pf(r.pol.PM, 2), pf(r.runoff, 2), pf(r.chf, 2), r.flags.map(k => T(k)).join('; '));
    return v;
  });
  const tot = [Pt.total, '', '']; if (hasClass) tot.push('');
  tot.push('', '', '', pf(s.C), pf(s.seq, 2), pf(s.o2, 2), pf(s.CO, 2), pf(s.O3, 1), pf(s.NO2, 1), pf(s.SO2, 1), pf(s.PM, 2), pf(s.runoff, 2), pf(s.chf, 2), '');
  body.push(tot);
  const flagCol = hdr.length - 1, textCols = hasClass ? 4 : 3;
  autoTable(doc, {
    ...tblStyle, startY: 20, margin: { left: M, right: M, top: 20 }, head: [hdr], body,
    styles: { ...tblStyle.styles, fontSize: 6.6, cellPadding: 1.3, overflow: 'linebreak' }, headStyles: { ...tblStyle.headStyles, fontSize: 6.4 },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 30 }, 1: { halign: 'left', cellWidth: 9 }, 2: { halign: 'left', cellWidth: 16 }, ...(hasClass ? { 3: { halign: 'left', cellWidth: 12 } } : {}), [flagCol]: { halign: 'left', cellWidth: 48, textColor: rgb(HEX.warn), fontSize: 6 } },
    didParseCell: d => { baseParse(d); if (d.section === 'head' && (d.column.index < textCols || d.column.index === flagCol)) d.cell.styles.halign = 'left'; },
  });

  // ---- Projection page
  doc.addPage('a4', 'portrait');
  hdrBand(T('projTitle'), T('title'));
  H(8.5, 'normal', HEX.muted); doc.text(doc.splitTextToSize(T('projSub'), CW), M, 38, { lineHeightFactor: 1.4 });
  const pimg = img(projectionChartConfig(rows, p, T, true), 900, 380); doc.addImage(pimg, 'JPEG', M, 50, CW, CW * 380 / 900);
  let py = 50 + CW * 380 / 900 + 8;
  const kp = HZ.map(yv => { const q = s.proj[yv]; return [yrLbl(yv), pf(q.C), `CHF ${pf(q.chf)}`, `CHF ${pf(q.cum)}`]; });
  const bw2 = (CW - 2 * 4) / 3, bh2 = 24;
  kp.forEach((k, i) => {
    const x = M + i * (bw2 + 4);
    doc.setFillColor(...rgb(HEX.soft)); doc.setDrawColor(...rgb(HEX.green)); doc.setLineWidth(0.3); doc.roundedRect(x, py, bw2, bh2, 1.5, 1.5, 'FD');
    H(6.5, 'bold', HEX.muted); doc.text(k[0].toUpperCase(), x + 4, py + 6); H(12, 'bold', HEX.green); doc.text(k[1] + ' kg C', x + 4, py + 13);
    H(7, 'normal', HEX.muted); doc.text(`${T('pChf')} ${k[2]}  ·  ${T('pCum')} ${k[3]}`, x + 4, py + 19);
  });
  py += bh2 + 10;
  const bySpP: Record<string, { n: number; C0: number; p: Record<number, { C: number; cum: number }> }> = {};
  for (const r of rows) {
    const b = bySpP[r.species] = bySpP[r.species] || { n: 0, C0: 0, p: {} };
    b.n++; b.C0 += r.C;
    for (const yv of HZ) { const q = b.p[yv] = b.p[yv] || { C: 0, cum: 0 }; q.C += r.proj[yv].C; q.cum += r.proj[yv].cum; }
  }
  const lastH = HZ[HZ.length - 1];
  const projHead = [[Pt.species, Pt.count, `${Pt.storage} ${de ? 'heute' : 'today'} kg`, ...HZ.map(yv => `${Pt.storage} ${yrLbl(yv)} kg`), ...HZ.map(yv => `${T('pCum')} ${yrLbl(yv)} CHF`)]];
  const projRows = Object.entries(bySpP).sort((x, z) => z[1].p[lastH].cum - x[1].p[lastH].cum).map(([k, b]) => [k, String(b.n), pf(b.C0), ...HZ.map(yv => pf(b.p[yv].C)), ...HZ.map(yv => pf(b.p[yv].cum))]);
  projRows.push([Pt.total, String(n), pf(s.C), ...HZ.map(yv => pf(s.proj[yv].C)), ...HZ.map(yv => pf(s.proj[yv].cum))]);
  autoTable(doc, { ...tblStyle, startY: py, margin: { left: M, right: M }, head: projHead, body: projRows, styles: { ...tblStyle.styles, fontSize: 7.5 }, headStyles: { ...tblStyle.headStyles, fontSize: 6.8 } });

  // ---- Last page: parameters & notes
  doc.addPage('a4', 'portrait');
  hdrBand(Pt.params, T('title'));
  const luKey = LANDUSE_OPTIONS.find(o => o.value === p.landuse)?.key;
  const prm: [string, string][] = [
    [Pt.pAir, ''], ['O3', pf(p.cO3, 1)], ['NO2', pf(p.cNO2, 1)], ['SO2', pf(p.cSO2, 1)], ['PM2.5', pf(p.cPM, 1)], ['CO', pf(p.cCO)],
    [Pt.pClim, ''], [Pt.precip, pf(p.precip)], [Pt.raindays, pf(p.raindays)], [Pt.ffd, pf(p.ffd)], [Pt.leafon, pf(p.leafon)],
    [Pt.pSite, ''], [Pt.landuse, (luKey ? T(luKey) : '') + ' (' + p.landuse + ' cm/a)'], [Pt.runoffShare, pf(p.runoffShare * 100, 1) + ' %'],
    [Pt.pPrice, ''], ['CO2', pf(p.pCO2)], ['O3', pf(p.pO3)], ['NO2', pf(p.pNO2)], ['SO2', pf(p.pSO2)], ['PM2.5', pf(p.pPM)], ['CO', pf(p.pCO)], [Pt.runoffP, pf(p.pRun, 2)],
  ];
  if (hasClass && input.sizeClasses) {
    prm.push([Pt.sizeClasses, '']);
    for (const k of SIZE_CLASS_KEYS) { const c = input.sizeClasses[k]; prm.push([`${T(k)} (${c.label})`, `${pf(c.dbh, 1)} / ${pf(c.height, 1)} / ${pf(c.crownWidth, 1)} / ${pf(c.crownBase, 1)}`]); }
  }
  autoTable(doc, {
    ...tblStyle, startY: 40, margin: { left: M, right: W / 2 + 4 }, head: [], body: prm, columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right', cellWidth: 30 } },
    didParseCell: d => { if ((d.row.raw as string[])[1] === '') { d.cell.styles.fontStyle = 'bold'; d.cell.styles.textColor = rgb(HEX.green); d.cell.styles.fillColor = rgb(HEX.soft); } },
  });
  H(12, 'bold', HEX.green); doc.text(Pt.notes, W / 2 + 8, 45); H(8.5, 'normal', HEX.ink); doc.text(doc.splitTextToSize(Pt.noteTxt, W / 2 - 8 - M), W / 2 + 8, 52, { lineHeightFactor: 1.45 });

  // footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); const ps = doc.internal.pageSize;
    H(7, 'normal', HEX.muted); doc.text(`${T('title')} · ${T('subtitle')}`, M, ps.getHeight() - 8); doc.text(`${Pt.page} ${i}/${pages}`, ps.getWidth() - M, ps.getHeight() - 8, { align: 'right' });
  }
  return doc;
}

/** Build and download the report. */
export function exportTreeBenefitsPdf(input: PdfInput): { pages: number; name: string } {
  const doc = buildTreeBenefitsPdf(input);
  const base = input.projectName || input.site.name.split(',')[0];
  const name = `${input.lang === 'de' ? 'Baumleistungen' : 'TreeBenefits'}_${base.replace(/[^\w-]+/g, '-')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(name);
  return { pages: doc.getNumberOfPages(), name };
}
