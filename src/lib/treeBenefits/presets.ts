import { SitePreset, SiteParams, Lang } from './types';

/**
 * Site presets: c = annual means µg/m³ (rounded, Ostluft/NABEL ~2023), precip mm/yr,
 * raindays ≥ 1 mm, ffd frost-free days, leafon deciduous leaf-on days,
 * runoffShare = avoided runoff ÷ rain retained by the crown as computed by i-Tree MyTree for the
 * canton (i-Tree uses canton-level location data; read off MyTree results, Nov 2026).
 */
export const PRESETS: SitePreset[] = [
  { id: 'rapperswil', name: 'Rapperswil-Jona SG', lat: 47.226, lon: 8.818, elev: 409, c: { O3: 50, NO2: 15, SO2: 1.5, PM: 9, CO: 250 }, precip: 1400, raindays: 140, ffd: 190, leafon: 195, runoffShare: 0.0247 },
  { id: 'zuerich', name: 'Zürich', lat: 47.37, lon: 8.54, elev: 408, c: { O3: 45, NO2: 22, SO2: 2, PM: 10, CO: 300 }, precip: 1100, raindays: 125, ffd: 200, leafon: 200, runoffShare: 0.0585 },
  { id: 'winterthur', name: 'Winterthur', lat: 47.50, lon: 8.72, elev: 439, c: { O3: 47, NO2: 18, SO2: 1.5, PM: 9, CO: 270 }, precip: 1050, raindays: 125, ffd: 190, leafon: 195, runoffShare: 0.0585 },
  { id: 'stgallen', name: 'St. Gallen', lat: 47.42, lon: 9.37, elev: 670, c: { O3: 48, NO2: 17, SO2: 1.5, PM: 8, CO: 250 }, precip: 1250, raindays: 140, ffd: 175, leafon: 185, runoffShare: 0.0247 },
  { id: 'luzern', name: 'Luzern', lat: 47.05, lon: 8.31, elev: 435, c: { O3: 47, NO2: 20, SO2: 1.5, PM: 9, CO: 280 }, precip: 1150, raindays: 130, ffd: 195, leafon: 195, runoffShare: 0.0205 },
  { id: 'basel', name: 'Basel', lat: 47.56, lon: 7.59, elev: 260, c: { O3: 45, NO2: 22, SO2: 2, PM: 10, CO: 300 }, precip: 850, raindays: 115, ffd: 215, leafon: 205, runoffShare: 0.2403 },
  { id: 'bern', name: 'Bern', lat: 46.95, lon: 7.45, elev: 540, c: { O3: 45, NO2: 20, SO2: 1.5, PM: 9, CO: 280 }, precip: 1050, raindays: 125, ffd: 185, leafon: 190, runoffShare: 0.0149 },
  { id: 'chur', name: 'Chur', lat: 46.85, lon: 9.53, elev: 590, c: { O3: 45, NO2: 20, SO2: 1.5, PM: 9, CO: 260 }, precip: 850, raindays: 110, ffd: 190, leafon: 190, runoffShare: 0.0032 },
  { id: 'lausanne', name: 'Lausanne', lat: 46.52, lon: 6.63, elev: 495, c: { O3: 50, NO2: 22, SO2: 2, PM: 10, CO: 290 }, precip: 1100, raindays: 120, ffd: 205, leafon: 200, runoffShare: 0.0183 },
  { id: 'genf', name: 'Genève', lat: 46.20, lon: 6.14, elev: 375, c: { O3: 48, NO2: 24, SO2: 2, PM: 11, CO: 300 }, precip: 1000, raindays: 115, ffd: 220, leafon: 205, runoffShare: 0.1191 },
  { id: 'lugano', name: 'Lugano', lat: 46.00, lon: 8.95, elev: 273, c: { O3: 60, NO2: 25, SO2: 2, PM: 14, CO: 320 }, precip: 1550, raindays: 105, ffd: 240, leafon: 215, runoffShare: 0.0156 },
  { id: 'davos', name: 'Davos (alpin)', lat: 46.80, lon: 9.84, elev: 1560, c: { O3: 55, NO2: 8, SO2: 1, PM: 5, CO: 200 }, precip: 1050, raindays: 125, ffd: 110, leafon: 140, runoffShare: 0.0032 },
  { id: 'milano', name: 'Milano (IT)', lat: 45.46, lon: 9.19, elev: 120, c: { O3: 45, NO2: 40, SO2: 3, PM: 20, CO: 400 }, precip: 900, raindays: 80, ffd: 260, leafon: 215, runoffShare: 0.2378 },
];

export const DEFAULT_PRESET = PRESETS[0];

export function nearestPreset(lat: number, lon: number): SitePreset {
  return PRESETS.reduce<{ d: number; p: SitePreset }>((b, p) => {
    const d = Math.hypot(p.lat - lat, (p.lon - lon) * Math.cos(lat * Math.PI / 180));
    return d < b.d ? { d, p } : b;
  }, { d: 1e9, p: PRESETS[0] }).p;
}

/** Apply the climate and air values of a preset (or live result) to a parameter set. */
export function applyPresetToParams(p: SiteParams, s: SitePreset | LiveSite): SiteParams {
  return {
    ...p,
    cO3: s.c.O3, cNO2: s.c.NO2, cSO2: s.c.SO2, cPM: s.c.PM, cCO: s.c.CO,
    precip: s.precip, raindays: s.raindays, ffd: s.ffd, leafon: s.leafon, runoffShare: s.runoffShare,
  };
}

export interface LiveSite {
  name: string;
  elev: number;
  c: { O3: number; NO2: number; SO2: number; PM: number; CO: number };
  precip: number;
  raindays: number;
  ffd: number;
  leafon: number;
  /** i-Tree avoided-runoff share, taken from the nearest preset */
  runoffShare: number;
  /** 'climate:<preset label>' / 'air:<preset label>' when a service was unavailable and preset values were used */
  fallback: string[];
}

export class LiveLookupError extends Error {
  constructor(public kind: 'none' | 'offline' | 'network') { super(kind); }
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Live site lookup: geocode a place name via Open-Meteo, then load a 10-year climate archive
 * (ERA5) and one year of CAMS air-quality data and reduce them to the annual parameters.
 * Falls back to the nearest preset per data source when a service fails.
 */
interface GeoResult { name: string; admin1?: string; country_code?: string; population?: number; latitude: number; longitude: number; elevation?: number }
interface GeoResponse { results?: GeoResult[] }
interface ClimateResponse { daily?: { time: string[]; precipitation_sum: (number | null)[]; temperature_2m_min: (number | null)[]; temperature_2m_mean: (number | null)[] } }
interface AirResponse { hourly?: { ozone: (number | null)[]; nitrogen_dioxide: (number | null)[]; sulphur_dioxide: (number | null)[]; pm2_5: (number | null)[]; carbon_monoxide: (number | null)[] } }

export async function liveLookup(query: string, lang: Lang): Promise<LiveSite> {
  let g: GeoResponse;
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=${lang}&format=json`);
    g = await res.json();
  } catch {
    throw new LiveLookupError('network');
  }
  if (!g.results || !g.results.length) throw new LiveLookupError('none');
  const EU = new Set(['CH', 'LI', 'DE', 'AT', 'IT', 'FR', 'ES', 'PT', 'NL', 'BE', 'LU', 'DK', 'SE', 'NO', 'FI', 'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'GB', 'IE', 'GR', 'RO', 'BG', 'EE', 'LV', 'LT']);
  const score = (x: GeoResult) => (x.country_code === 'CH' || x.country_code === 'LI' ? 2e9 : EU.has(x.country_code || '') ? 1e9 : 0) + (x.population || 0);
  const r = [...g.results].sort((a, b) => score(b) - score(a))[0];
  return liveLookupCoords(r.latitude, r.longitude, [r.name, r.admin1, r.country_code].filter(Boolean).join(', '), r.elevation);
}

/** Same as liveLookup, but for known coordinates (e.g. from the Academy postal-code search). */
export async function liveLookupCoords(lat: number, lon: number, name: string, elevation?: number | null): Promise<LiveSite> {
  const near = nearestPreset(lat, lon);
  const distKm = Math.round(111 * Math.hypot(near.lat - lat, (near.lon - lon) * Math.cos(lat * Math.PI / 180)));
  const nearLabel = `${near.name}, ≈${distKm} km`;
  const jsonOrNull = <R,>(u: string): Promise<R | null> => fetch(u).then(x => x.json() as Promise<R>).catch(() => null);
  const [cl, aq] = await Promise.all<[Promise<ClimateResponse | null>, Promise<AirResponse | null>]>([
    jsonOrNull(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2015-01-01&end_date=2024-12-31&daily=precipitation_sum,temperature_2m_min,temperature_2m_mean&timezone=auto`),
    jsonOrNull(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide&start_date=2024-01-01&end_date=2024-12-31&timezone=auto`),
  ]);
  const out: LiveSite = {
    name, elev: Math.round(elevation || near.elev), fallback: [], runoffShare: near.runoffShare,
    c: { ...near.c }, precip: near.precip, raindays: near.raindays, ffd: near.ffd, leafon: near.leafon,
  };
  // climate
  let ok = false;
  if (cl && cl.daily && cl.daily.time) {
    const d = cl.daily;
    const years: Record<string, { p: number; rd: number; tmin: (number | null)[]; lo: number }> = {};
    d.time.forEach((t, i) => {
      const y = t.slice(0, 4);
      const o = years[y] = years[y] || { p: 0, rd: 0, tmin: [], lo: 0 };
      const p = d.precipitation_sum[i] || 0;
      o.p += p; if (p >= 1) o.rd++;
      o.tmin.push(d.temperature_2m_min[i]);
      if ((d.temperature_2m_mean[i] ?? -99) >= 8) o.lo++;
    });
    let P = 0, RD = 0, FF = 0, LO = 0, n = 0;
    for (const y in years) {
      const o = years[y];
      if (o.tmin.length < 360) continue;
      n++; P += o.p; RD += o.rd; LO += o.lo;
      let streak = 0, best = 0;
      for (const t of o.tmin) { if (t != null && t > 0) { streak++; if (streak > best) best = streak; } else streak = 0; }
      FF += best;
    }
    if (n) {
      out.precip = Math.round(P / n / 10) * 10; out.raindays = Math.round(RD / n); out.ffd = Math.round(FF / n); out.leafon = Math.min(245, Math.round(LO / n));
      ok = true;
    }
  }
  if (!ok) out.fallback.push('climate:' + nearLabel);
  // air quality
  const mean = (a: (number | null)[] | undefined) => { const v = (a || []).filter((x): x is number => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const h = aq?.hourly;
  const o3 = h ? mean(h.ozone) : null;
  if (h && o3 != null) {
    out.c = { O3: r1(o3), NO2: r1(mean(h.nitrogen_dioxide) ?? 0), SO2: r1(mean(h.sulphur_dioxide) ?? 0), PM: r1(mean(h.pm2_5) ?? 0), CO: Math.round(mean(h.carbon_monoxide) ?? 0) };
  } else {
    out.fallback.push('air:' + nearLabel);
  }
  if (out.fallback.length === 2) throw new LiveLookupError('offline');
  return out;
}
