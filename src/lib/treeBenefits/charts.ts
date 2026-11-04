import { Chart, ChartConfiguration, ChartDataset, registerables } from 'chart.js';
import { horizons, seriesTotal, O2_PER_PERSON } from './calc';
import { TFn } from './i18n';
import { Lang, SiteParams, TreeResult } from './types';

Chart.register(...registerables);

/** Brand-neutral chart colours (same on screen and in the PDF). */
export const HEX = {
  green: '#2F7041', air: '#4779A7', water: '#5797AA', o2: '#A8BE87',
  muted: '#5E6861', ink: '#173D25', line: '#C9D5CC', soft: '#E4F0E6', warn: '#9A681F',
};

const FONT = "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif";

/** Cumulative value (CHF) and carbon storage (kg) over the projection years. */
export function projectionChartConfig(rows: TreeResult[], p: SiteParams, T: TFn, forPdf: boolean): ChartConfiguration {
  const ser = seriesTotal(rows, p), HZ = horizons(p);
  const pts = ser.map(x => (HZ.includes(x.y) ? 4 : 0));
  return {
    type: 'line',
    data: {
      labels: ser.map(x => x.y),
      datasets: [
        { label: T('chartCum'), data: ser.map(x => Math.round(x.cum)), borderColor: HEX.green, backgroundColor: HEX.green + '22', fill: true, tension: 0.25, pointRadius: pts, pointBackgroundColor: HEX.green, yAxisID: 'y' },
        { label: T('chartC'), data: ser.map(x => Math.round(x.C)), borderColor: HEX.o2, borderDash: [5, 4], tension: 0.25, pointRadius: pts, pointBackgroundColor: HEX.o2, yAxisID: 'y2' },
      ],
    },
    options: {
      responsive: !forPdf, maintainAspectRatio: false, animation: forPdf ? false : undefined,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, color: HEX.muted, font: { size: 11, family: FONT } } } },
      scales: {
        x: { title: { display: true, text: T('chartX'), color: HEX.muted, font: { size: 10 } }, grid: { display: false }, ticks: { color: HEX.muted, font: { size: 10 }, maxTicksLimit: 11 } },
        y: { position: 'left', title: { display: true, text: 'CHF', color: HEX.muted, font: { size: 10 } }, grid: { color: HEX.line }, ticks: { color: HEX.muted, font: { size: 10 } } },
        y2: { position: 'right', title: { display: true, text: 'kg C', color: HEX.muted, font: { size: 10 } }, grid: { display: false }, ticks: { color: HEX.muted, font: { size: 10 } } },
      },
    },
  };
}

/** Oxygen production (kg/yr, bars) and people supplied (line) over the projection years. */
export function oxygenChartConfig(rows: TreeResult[], p: SiteParams, T: TFn, lang: Lang, forPdf: boolean): ChartConfiguration {
  const ser = seriesTotal(rows, p), HZ = horizons(p);
  const pts = ser.map(x => (HZ.includes(x.y) ? 4 : 0));
  return {
    type: 'bar',
    data: {
      labels: ser.map(x => x.y),
      datasets: [
        { type: 'bar', label: T('chartO2'), data: ser.map(x => +x.o2.toFixed(1)), backgroundColor: HEX.o2 + '99', borderColor: HEX.o2, borderWidth: 1, borderRadius: 2, yAxisID: 'y', order: 2 },
        { type: 'line', label: T('chartPers'), data: ser.map(x => +(x.o2 / O2_PER_PERSON).toFixed(2)), borderColor: HEX.green, backgroundColor: HEX.green, tension: 0.25, pointRadius: pts, yAxisID: 'y2', order: 1 } as unknown as ChartDataset<'bar'>,
      ],
    },
    options: {
      responsive: !forPdf, maintainAspectRatio: false, animation: forPdf ? false : undefined,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, color: HEX.muted, font: { size: 11, family: FONT } } } },
      scales: {
        x: { title: { display: true, text: T('chartX'), color: HEX.muted, font: { size: 10 } }, grid: { display: false }, ticks: { color: HEX.muted, font: { size: 10 }, maxTicksLimit: 11 } },
        y: { position: 'left', title: { display: true, text: 'kg O₂ / ' + (lang === 'de' ? 'Jahr' : 'yr'), color: HEX.muted, font: { size: 10 } }, grid: { color: HEX.line }, ticks: { color: HEX.muted, font: { size: 10 } }, beginAtZero: true },
        y2: { position: 'right', title: { display: true, text: T('chartPers'), color: HEX.muted, font: { size: 10 } }, grid: { display: false }, ticks: { color: HEX.muted, font: { size: 10 } }, beginAtZero: true },
      },
    },
  };
}

/** Render a chart configuration offscreen and return a JPEG data URL on white (small enough for the PDF). */
export function chartToImage(cfg: ChartConfiguration, w: number, h: number): string {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(c);
  Chart.defaults.font.family = FONT;
  Chart.defaults.color = HEX.muted;
  const ch = new Chart(c.getContext('2d')!, { ...cfg, options: { ...(cfg.options || {}), animation: false, responsive: false, devicePixelRatio: 2 } });
  // flatten onto white: JPEG has no alpha and keeps the report small
  const flat = document.createElement('canvas');
  flat.width = c.width; flat.height = c.height;
  const fctx = flat.getContext('2d')!;
  fctx.fillStyle = '#FFFFFF'; fctx.fillRect(0, 0, flat.width, flat.height);
  fctx.drawImage(c, 0, 0);
  const url = flat.toDataURL('image/jpeg', 0.92);
  ch.destroy(); c.remove();
  return url;
}
