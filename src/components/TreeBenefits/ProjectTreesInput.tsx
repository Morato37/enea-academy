import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TFn } from '../../lib/treeBenefits/i18n';
import { ProjectHandover, ProjectTreeInput, SizeClassKey, SizeClassStandard } from '../../lib/treeBenefits/types';
import { SIZE_CLASS_KEYS, fetchSpeciesSizeClasses } from '../../lib/treeBenefits/sizeClasses';
import { SizeClassEditor } from './SizeClassEditor';

interface Props {
  T: TFn;
  handover: ProjectHandover | null;
  trees: ProjectTreeInput[];
  onChange: (trees: ProjectTreeInput[]) => void;
  classes: Record<SizeClassKey, SizeClassStandard>;
  onClassesChange: (classes: Record<SizeClassKey, SizeClassStandard>) => void;
}

interface PlantHit {
  id: number;
  botanical_name: string;
  common_name_de?: string | null;
  common_name_en?: string | null;
  characteristic_evergreen?: boolean | null;
  characteristic_deciduous?: boolean | null;
}

/** Trees handed over from a project selection: quantity and size class per species, plus manual additions. */
export const ProjectTreesInput: React.FC<Props> = ({ T, handover, trees, onChange, classes, onClassesChange }) => {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PlantHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [speciesOverrides, setSpeciesOverrides] = useState<Map<string, SizeClassStandard>>(new Map());
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Fetch species-specific size class overrides from the database
  useEffect(() => {
    const ids = trees.map(t => t.plantId).filter((id): id is number => typeof id === 'number' && id > 0);
    if (ids.length === 0) { setSpeciesOverrides(new Map()); return; }
    let cancelled = false;
    fetchSpeciesSizeClasses(ids).then(map => { if (!cancelled) setSpeciesOverrides(map); });
    return () => { cancelled = true; };
  }, [trees]);

  // species autocomplete from the Academy plant database (trees and palms only)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setHits([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from('plants_flat')
          .select('id, botanical_name, common_name_de, common_name_en, characteristic_evergreen, characteristic_deciduous')
          .ilike('botanical_name', `%${q}%`)
          .or('category_tree.eq.true,category_palm.eq.true')
          .order('botanical_name')
          .limit(8);
        if (!cancelled) { setHits((data as PlantHit[]) || []); setOpen(true); }
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const update = (key: string, patch: Partial<ProjectTreeInput>) => onChange(trees.map(t => (t.key === key ? { ...t, ...patch } : t)));
  const remove = (key: string) => onChange(trees.filter(t => t.key !== key));
  const setAll = (sizeClass: SizeClassKey) => onChange(trees.map(t => ({ ...t, sizeClass })));

  const add = (species: string, extra?: Partial<ProjectTreeInput>) => {
    const name = species.trim();
    if (!name) return;
    const existing = trees.find(t => t.species.toLowerCase() === name.toLowerCase());
    if (existing) update(existing.key, { quantity: existing.quantity + 1 });
    else onChange([...trees, { key: `m${Date.now()}`, species: name, quantity: 1, sizeClass: 'medium', ...extra }]);
    setQuery(''); setHits([]); setOpen(false);
  };

  const total = trees.reduce((a, t) => a + (t.quantity || 0), 0);

  const getStd = (t: ProjectTreeInput): SizeClassStandard => {
    if (t.plantId) {
      const ov = speciesOverrides.get(`${t.plantId}:${t.sizeClass}`);
      if (ov) return ov;
    }
    return classes[t.sizeClass] || classes.medium;
  };

  return (
    <div className="space-y-4">
      {handover && (handover.projectName || handover.zoneName) && (
        <div className="text-xs text-gray-500">
          {T('projFrom')}: <span className="font-medium text-gray-700">{[handover.projectName, handover.zoneName].filter(Boolean).join(' — ')}</span>
        </div>
      )}
      {!handover && trees.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">{T('projEmpty')}</div>
      )}
      {handover && handover.trees.length === 0 && trees.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{T('projNoTrees')}</div>
      )}

      {trees.length > 0 && (
        <>
          <p className="text-xs text-gray-500">{T('projHint')}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500">{T('treesTotal', total, trees.length)}</span>
            <span className="mx-1 text-gray-300">·</span>
            {SIZE_CLASS_KEYS.map(k => (
              <button key={k} type="button" onClick={() => setAll(k)} className="rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-gray-600 hover:border-[#E4F0E6]0 hover:text-[#2F7041]">
                {T(`all${k.charAt(0).toUpperCase()}${k.slice(1)}`)}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-2">{T('hSpecies')}</th>
                  <th className="px-3 py-2">{T('common')}</th>
                  <th className="px-3 py-2 text-right">{T('qty')}</th>
                  <th className="px-3 py-2">{T('sizeClass')}</th>
                  <th className="px-3 py-2 text-right">DBH / {T('hH')}</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {trees.map(t => {
                  const std = getStd(t);
                  const hasOverride = t.plantId ? speciesOverrides.has(`${t.plantId}:${t.sizeClass}`) : false;
                  return (
                    <tr key={t.key} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-1.5 font-medium italic text-gray-800">{t.species}</td>
                      <td className="px-3 py-1.5 text-gray-500">{t.commonName || ''}</td>
                      <td className="px-3 py-1.5 text-right">
                        <input
                          type="number" min={0} max={999} step={1} value={t.quantity}
                          onChange={e => update(t.key, { quantity: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                          className="w-16 rounded border border-gray-300 bg-white px-2 py-1 text-right font-mono text-sm focus:border-[#E4F0E6]0 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <select value={t.sizeClass} onChange={e => update(t.key, { sizeClass: e.target.value as SizeClassKey })} className="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-[#E4F0E6]0 focus:outline-none">
                          {SIZE_CLASS_KEYS.map(k => <option key={k} value={k}>{T(k)} · {classes[k].label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">
                        <span className={hasOverride ? 'text-[#2F7041] font-semibold' : 'text-gray-500'}>
                          {std.dbh} cm / {std.height} m
                        </span>
                        {hasOverride && <span className="ml-1 text-[10px] text-[#2F7041]" title={T('scSpeciesSpecific')}>★</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button type="button" onClick={() => remove(t.key)} title={T('remove')} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div ref={wrapRef} className="relative">
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); add(query); }}>
          <div className="relative flex-1">
            <input
              type="text" value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => hits.length && setOpen(true)}
              placeholder={T('speciesPh')} autoComplete="off"
              className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-[#E4F0E6]0 focus:outline-none"
            />
            {searching && <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-gray-400" />}
            {open && hits.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {hits.map(h => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => add(h.botanical_name, { plantId: h.id, commonName: h.common_name_de || h.common_name_en || undefined, evergreen: h.characteristic_evergreen ? true : h.characteristic_deciduous ? false : undefined })}
                      className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-[#E4F0E6]"
                    >
                      <span className="italic text-gray-800">{h.botanical_name}</span>
                      <span className="truncate text-xs text-gray-500">{h.common_name_de || h.common_name_en || ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" disabled={!query.trim()} className="flex items-center gap-1 rounded border border-[#2F7041] bg-white px-3 py-1.5 text-sm font-semibold text-[#2F7041] hover:bg-[#E4F0E6] disabled:opacity-50">
            <Plus className="h-4 w-4" /> {T('addSpecies')}
          </button>
        </form>
      </div>

      <SizeClassEditor T={T} classes={classes} onChange={onClassesChange} />
    </div>
  );
};
