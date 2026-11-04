import React, { useCallback, useEffect, useState } from 'react';
import { Search, Save, Loader2, Trash2, Plus, Ruler } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TreeSizeClass, TreeSizeClassKey } from '../../lib/supabase';
import { DEFAULT_SIZE_CLASSES } from '../../lib/treeBenefits/sizeClasses';

interface PlantRow {
  id: number;
  botanical_name: string;
  common_name_de?: string | null;
}

interface EditRow {
  plant_id: number;
  botanical_name: string;
  common_name_de?: string | null;
  size_class: TreeSizeClassKey;
  label: string;
  dbh: string;
  height: string;
  crown_width: string;
  crown_base: string;
  dirty: boolean;
}

const SIZE_CLASSES: TreeSizeClassKey[] = ['small', 'medium', 'large'];
const SIZE_LABELS: Record<TreeSizeClassKey, string> = { small: 'Small', medium: 'Medium', large: 'Large' };

const inputCls = 'w-full rounded border border-gray-300 bg-white px-2 py-1 text-right font-mono text-sm focus:border-[#3C8150] focus:outline-none';
const textCls = 'w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-[#3C8150] focus:outline-none';

export const TreeSizeClassesEditor: React.FC = () => {
  const [query, setQuery] = useState('');
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [rows, setRows] = useState<EditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2500); }, []);

  // Search trees/palms from the plant database
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setPlants([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from('plants_flat')
          .select('id, botanical_name, common_name_de')
          .ilike('botanical_name', `%${q}%`)
          .or('category_tree.eq.true,category_palm.eq.true')
          .order('botanical_name')
          .limit(20);
        if (!cancelled) setPlants((data as PlantRow[]) || []);
      } catch {
        if (!cancelled) setPlants([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  // Load existing size class entries for the selected plants
  const loadEntries = useCallback(async (plantIds: number[]) => {
    if (plantIds.length === 0) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tree_size_classes')
        .select('id, plant_id, size_class, label, dbh, height, crown_width, crown_base')
        .in('plant_id', plantIds);
      const existing = (data as TreeSizeClass[]) || [];

      const newRows: EditRow[] = [];
      for (const p of plants) {
        for (const sc of SIZE_CLASSES) {
          const match = existing.find(e => e.plant_id === p.id && e.size_class === sc);
          const def = DEFAULT_SIZE_CLASSES[sc];
          newRows.push({
            plant_id: p.id,
            botanical_name: p.botanical_name,
            common_name_de: p.common_name_de,
            size_class: sc,
            label: match?.label ?? '',
            dbh: match ? String(match.dbh) : String(def.dbh),
            height: match ? String(match.height) : String(def.height),
            crown_width: match ? String(match.crown_width) : String(def.crown_width),
            crown_base: match ? String(match.crown_base) : String(def.crown_base),
            dirty: false,
          });
        }
      }
      setRows(newRows);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [plants]);

  // When plants list changes, load their entries
  useEffect(() => {
    if (plants.length > 0) loadEntries(plants.map(p => p.id));
    else setRows([]);
  }, [plants, loadEntries]);

  const updateRow = (plantId: number, sc: TreeSizeClassKey, field: keyof EditRow, value: string) => {
    setRows(prev => prev.map(r =>
      r.plant_id === plantId && r.size_class === sc ? { ...r, [field]: value, dirty: true } : r
    ));
  };

  const save = async () => {
    const dirtyRows = rows.filter(r => r.dirty);
    if (dirtyRows.length === 0) { showToast('There are no changes to save.'); return; }
    setSaving(true);
    try {
      const upserts = dirtyRows.map(r => ({
        plant_id: r.plant_id,
        size_class: r.size_class,
        label: r.label,
        dbh: parseFloat(r.dbh) || 0,
        height: parseFloat(r.height) || 0,
        crown_width: parseFloat(r.crown_width) || 0,
        crown_base: parseFloat(r.crown_base) || 0,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('tree_size_classes')
        .upsert(upserts, { onConflict: 'plant_id,size_class' });
      if (error) throw error;
      setRows(prev => prev.map(r => ({ ...r, dirty: false })));
      showToast(`${dirtyRows.length} entries saved.`);
    } catch (e) {
      showToast(`Error: ${String((e as Error)?.message || e)}`)
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = (plantId: number, sc: TreeSizeClassKey) => {
    const def = DEFAULT_SIZE_CLASSES[sc];
    setRows(prev => prev.map(r =>
      r.plant_id === plantId && r.size_class === sc
        ? { ...r, label: '', dbh: String(def.dbh), height: String(def.height), crown_width: String(def.crown_width), crown_base: String(def.crown_base), dirty: true }
        : r
    ));
  };

  const deleteEntry = async (plantId: number, sc: TreeSizeClassKey) => {
    try {
      await supabase
        .from('tree_size_classes')
        .delete()
        .eq('plant_id', plantId)
        .eq('size_class', sc);
      const def = DEFAULT_SIZE_CLASSES[sc];
      setRows(prev => prev.map(r =>
        r.plant_id === plantId && r.size_class === sc
          ? { ...r, label: '', dbh: String(def.dbh), height: String(def.height), crown_width: String(def.crown_width), crown_base: String(def.crown_base), dirty: false }
          : r
      ));
      showToast('Entry deleted and reset to default.');
    } catch (e) {
      showToast(`Error: ${String((e as Error)?.message || e)}`)
    }
  };

  const hasDirty = rows.some(r => r.dirty);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Ruler className="h-5 w-5 text-[#2F7041]" />
        <h2 className="text-lg font-semibold text-gray-900">Tree size classes by species</h2>
      </div>
      <p className="text-sm text-gray-500">
        Set species-specific average measurements for each tree or palm and size class.
        If no species-specific values are available,
        the generic default values are used.
      </p>

      <div className="relative max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search botanical name …"
            className="w-full rounded border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-[#3C8150] focus:outline-none"
          />
          {searching && <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-gray-400" />}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading size classes …
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-2">Species</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2 text-right">DBH cm</th>
                  <th className="px-3 py-2 text-right">Height m</th>
                  <th className="px-3 py-2 text-right">Crown m</th>
                  <th className="px-3 py-2 text-right">Crown base m</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={`${r.plant_id}-${r.size_class}`} className={idx % 3 === 0 ? 'border-t-2 border-gray-200' : 'border-t border-gray-100'}>
                    {idx % 3 === 0 ? (
                      <td rowSpan={3} className="px-3 py-1.5 align-top font-medium italic text-gray-800">
                        {r.botanical_name}
                        {r.common_name_de && <div className="text-xs font-normal not-italic text-gray-400">{r.common_name_de}</div>}
                      </td>
                    ) : null}
                    <td className="px-3 py-1.5 text-gray-600">{SIZE_LABELS[r.size_class]}</td>
                    <td className="px-3 py-1.5"><input type="text" value={r.label} onChange={e => updateRow(r.plant_id, r.size_class, 'label', e.target.value)} className={textCls} placeholder="z.B. StU 16–18" /></td>
                    <td className="px-3 py-1.5"><input type="number" step={0.5} min={0} value={r.dbh} onChange={e => updateRow(r.plant_id, r.size_class, 'dbh', e.target.value)} className={inputCls} /></td>
                    <td className="px-3 py-1.5"><input type="number" step={0.5} min={0} value={r.height} onChange={e => updateRow(r.plant_id, r.size_class, 'height', e.target.value)} className={inputCls} /></td>
                    <td className="px-3 py-1.5"><input type="number" step={0.5} min={0} value={r.crown_width} onChange={e => updateRow(r.plant_id, r.size_class, 'crown_width', e.target.value)} className={inputCls} /></td>
                    <td className="px-3 py-1.5"><input type="number" step={0.1} min={0} value={r.crown_base} onChange={e => updateRow(r.plant_id, r.size_class, 'crown_base', e.target.value)} className={inputCls} /></td>
                    <td className="px-2 py-1.5 text-right whitespace-nowrap">
                      <button type="button" onClick={() => resetToDefault(r.plant_id, r.size_class)} title="Reset to default" className="mr-1 text-gray-400 hover:text-gray-700"><Plus className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => deleteEntry(r.plant_id, r.size_class)} title="Delete" className="text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={!hasDirty || saving}
            className="flex items-center gap-1.5 rounded-lg bg-[#2F7041] px-4 py-2 text-sm font-semibold text-white hover:bg-[#245A34] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </>
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md bg-gray-900 px-3.5 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
};
