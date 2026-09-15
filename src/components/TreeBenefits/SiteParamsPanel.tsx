import React, { useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { TFn } from '../../lib/treeBenefits/i18n';
import { SiteParams } from '../../lib/treeBenefits/types';
import { PRESETS } from '../../lib/treeBenefits/presets';
import { LANDUSE_OPTIONS, SURFACE_OPTIONS, MAX_HORIZON } from '../../lib/treeBenefits/calc';

export interface GeoStatus { text: string; err: boolean }

interface Props {
  T: TFn;
  params: SiteParams;
  onParamChange: (key: keyof SiteParams, value: number) => void;
  presetId: string;
  onPreset: (id: string) => void;
  onLiveLookup: (query: string) => void;
  geoBusy: boolean;
  geoStatus: GeoStatus | null;
}

const NumField: React.FC<{ label: React.ReactNode; unit?: string; value: number; step?: number; min?: number; max?: number; onChange: (v: number) => void }> =
  ({ label, unit, value, step, min, max, onChange }) => (
    <label className="grid grid-cols-[1fr_100px] items-center gap-2 text-sm text-gray-700">
      <span>{label}{unit && <span className="ml-1 text-[11px] font-mono text-gray-400">{unit}</span>}</span>
      <input
        type="number"
        value={Number.isNaN(value) ? '' : value}
        step={step}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value === '' ? NaN : parseFloat(e.target.value))}
        className="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1 text-right font-mono text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
      />
    </label>
  );

const Group: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, defaultOpen, children }) => (
  <details open={defaultOpen} className="group border-t border-gray-100 first:border-t-0">
    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 hover:text-green-700">
      {title}
      <span className="font-mono text-sm text-gray-400 group-open:hidden">+</span>
      <span className="hidden font-mono text-sm text-gray-400 group-open:inline">–</span>
    </summary>
    <div className="grid gap-1.5 px-4 pb-3">{children}</div>
  </details>
);

export const SiteParamsPanel: React.FC<Props> = ({ T, params, onParamChange, presetId, onPreset, onLiveLookup, geoBusy, geoStatus }) => {
  const [query, setQuery] = useState('');
  const set = (k: keyof SiteParams) => (v: number) => onParamChange(k, v);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
      <div className="grid gap-2 border-b border-gray-200 bg-green-50 px-4 py-3">
        <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-green-700">
          <MapPin className="h-3.5 w-3.5" /> {T('gLoc')}
        </div>
        <select
          value={presetId}
          onChange={e => onPreset(e.target.value)}
          aria-label={T('gLoc')}
          className="w-full rounded border border-green-300 bg-white px-2 py-1.5 text-sm font-medium focus:border-green-600 focus:outline-none"
        >
          {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value="custom">{T('custom')}</option>
        </select>
        <form
          className="grid grid-cols-[1fr_auto] gap-1.5"
          onSubmit={e => { e.preventDefault(); if (query.trim()) onLiveLookup(query.trim()); }}
        >
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={T('geoPh')}
            autoComplete="off"
            className="min-w-0 rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-green-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={geoBusy || !query.trim()}
            className="flex items-center gap-1 rounded bg-green-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {geoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {T('geoBtn')}
          </button>
        </form>
        {geoStatus && (
          <div className={`text-[11.5px] leading-snug ${geoStatus.err ? 'text-amber-700' : 'text-gray-500'}`}>{geoStatus.text}</div>
        )}
      </div>

      <Group title={T('gAir')}>
        <NumField label="O₃" unit="µg/m³" value={params.cO3} step={1} onChange={set('cO3')} />
        <NumField label="NO₂" unit="µg/m³" value={params.cNO2} step={0.5} onChange={set('cNO2')} />
        <NumField label="SO₂" unit="µg/m³" value={params.cSO2} step={0.1} onChange={set('cSO2')} />
        <NumField label="PM₂.₅" unit="µg/m³" value={params.cPM} step={0.5} onChange={set('cPM')} />
        <NumField label="CO" unit="µg/m³" value={params.cCO} step={10} onChange={set('cCO')} />
      </Group>
      <Group title={T('gClim')}>
        <NumField label={T('precip')} unit="mm/a" value={params.precip} step={10} onChange={set('precip')} />
        <NumField label={T('raindays')} unit="d" value={params.raindays} step={1} onChange={set('raindays')} />
        <NumField label={T('ffd')} unit="d" value={params.ffd} step={1} onChange={set('ffd')} />
        <NumField label={T('leafon')} unit="d" value={params.leafon} step={1} onChange={set('leafon')} />
      </Group>
      <Group title={T('gSite')} defaultOpen>
        <label className="grid grid-cols-[1fr_100px] items-center gap-2 text-sm text-gray-700">
          <span>{T('landuse')}</span>
          <select value={params.landuse} onChange={e => onParamChange('landuse', parseFloat(e.target.value))} className="w-full rounded border border-gray-300 bg-gray-50 px-1 py-1 text-sm focus:border-green-600 focus:outline-none">
            {LANDUSE_OPTIONS.map(o => <option key={o.key} value={o.value}>{T(o.key)}</option>)}
          </select>
        </label>
        <label className="grid grid-cols-[1fr_100px] items-center gap-2 text-sm text-gray-700">
          <span>{T('surface')}</span>
          <select value={params.surface} onChange={e => onParamChange('surface', parseFloat(e.target.value))} className="w-full rounded border border-gray-300 bg-gray-50 px-1 py-1 text-sm focus:border-green-600 focus:outline-none">
            {SURFACE_OPTIONS.map(o => <option key={o.key} value={o.value}>{T(o.key)}</option>)}
          </select>
        </label>
      </Group>
      <Group title={T('gProj')} defaultOpen>
        <NumField label={T('yA')} unit={T('years')} value={params.y1} step={1} min={1} max={MAX_HORIZON} onChange={set('y1')} />
        <NumField label={T('yB')} unit={T('years')} value={params.y2} step={1} min={1} max={MAX_HORIZON} onChange={set('y2')} />
        <NumField label={T('yC')} unit={T('years')} value={params.y3} step={1} min={1} max={MAX_HORIZON} onChange={set('y3')} />
      </Group>
      <Group title={T('gPrice')}>
        <NumField label="CO₂" unit="CHF/t" value={params.pCO2} step={5} onChange={set('pCO2')} />
        <NumField label="O₃" unit="CHF/t" value={params.pO3} step={100} onChange={set('pO3')} />
        <NumField label="NO₂" unit="CHF/t" value={params.pNO2} step={500} onChange={set('pNO2')} />
        <NumField label="SO₂" unit="CHF/t" value={params.pSO2} step={500} onChange={set('pSO2')} />
        <NumField label="PM₂.₅" unit="CHF/t" value={params.pPM} step={5000} onChange={set('pPM')} />
        <NumField label="CO" unit="CHF/t" value={params.pCO} step={100} onChange={set('pCO')} />
        <NumField label={T('runoffP')} unit="CHF/m³" value={params.pRun} step={0.1} onChange={set('pRun')} />
      </Group>
      <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">{T('pfoot')}</div>
    </div>
  );
};
