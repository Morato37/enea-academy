import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, Download, Plus, Trash2, RotateCcw, GripVertical, FolderInput, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '@fontsource/josefin-sans/300.css';
import '@fontsource/josefin-sans/400.css';
import '@fontsource/josefin-sans/300-italic.css';
import {
  bluehkalenderReady,
  renderBluehkalender,
  plantFromDb,
  DEFAULT_OPTIONS,
  DEFAULT_CLIMATE,
  MSHORT_DE,
  MSHORT_EN,
  type BluehkalenderOptions,
  type BluehkalenderClimate,
  type CalendarPlant,
  type MonthEntry,
} from '../lib/bluehkalender/bluehkalender-renderer';

const MSHORT = (lang: 'de' | 'en') => lang === 'en' ? MSHORT_EN : MSHORT_DE;

interface CalendarRow {
  id: string;
  plant_id: number | null;
  position: number;
  custom_name: string | null;
  months_override: MonthEntry[] | null;
  bloom_color: string | null;
  leaf_color: string | null;
  masterPlant: CalendarPlant | null;
}

interface SearchResult {
  id: number;
  botanical_name: string;
  common_name_de: string | null;
  common_name_en: string | null;
  [key: string]: unknown;
}

const CATEGORY_FILTERS = [
  { key: 'category_perennial', label: 'Perennial' },
  { key: 'category_grass', label: 'Grass' },
  { key: 'category_shrub', label: 'Shrub' },
  { key: 'category_tree', label: 'Tree' },
  { key: 'category_climbing_plant', label: 'Climber' },
  { key: 'category_fern', label: 'Fern' },
];

export const BloomCalendarEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [centerText, setCenterText] = useState(DEFAULT_OPTIONS.centerText);
  const [options, setOptions] = useState<BluehkalenderOptions>(DEFAULT_OPTIONS);
  const [climate, setClimate] = useState<BluehkalenderClimate>(DEFAULT_CLIMATE);
  const [rows, setRows] = useState<CalendarRow[]>([]);
  const [rendering, setRendering] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [showImport, setShowImport] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [importProjectId, setImportProjectId] = useState<string | null>(null);
  const [importZones, setImportZones] = useState<{ id: string; name: string }[]>([]);
  const [importZoneId, setImportZoneId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const calendarId = id!;

  const buildPlants = useCallback((rowsList: CalendarRow[]): CalendarPlant[] => {
    return rowsList.map(r => {
      const base = r.masterPlant ? { ...r.masterPlant } : { bot: '', en: '', bloom: '#cccccc', leaf: '#6f9a5a', traits: [], m: Array(12).fill(null) as MonthEntry[] };
      if (r.custom_name) { base.bot = r.custom_name; base.en = r.custom_name; }
      if (r.bloom_color) base.bloom = r.bloom_color;
      if (r.leaf_color) base.leaf = r.leaf_color;
      if (r.months_override) base.m = r.months_override;
      return base;
    });
  }, []);

  const doRender = useCallback(() => {
    if (!canvasRef.current || !readyRef.current) return;
    setRendering(true);
    requestAnimationFrame(() => {
      try {
        if (!canvasRef.current) return;
        renderBluehkalender(canvasRef.current, {
          plants: buildPlants(rows),
          climate,
          options: { ...options, title, centerText },
        }, 0.5);
      } catch (e) {
        console.error('Render error:', e);
      }
      setRendering(false);
    });
  }, [rows, climate, options, title, centerText, buildPlants]);

  const scheduleRender = useCallback(() => {
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(doRender, 150);
  }, [doRender]);

  useEffect(() => {
    bluehkalenderReady().then(() => { readyRef.current = true; doRender(); });
  }, []);

  useEffect(() => { scheduleRender(); }, [rows, climate, options, title, centerText, scheduleRender]);

  const save = useCallback(() => {
    if (!calendarId) return;
    setSaveStatus('saving');
    (async () => {
      await supabase.from('bloom_calendars').update({
        title,
        center_text: centerText,
        options: { ...options, title, centerText },
        climate,
        updated_at: new Date().toISOString(),
      }).eq('id', calendarId);

      const existing = await supabase.from('bloom_calendar_plants')
        .select('id').eq('calendar_id', calendarId);
      const existingIds = new Set((existing.data || []).map(r => r.id));
      const upsertData = rows.map((r, i) => ({
        id: r.id,
        calendar_id: calendarId,
        plant_id: r.plant_id,
        position: i,
        custom_name: r.custom_name,
        months_override: r.months_override,
        bloom_color: r.bloom_color,
        leaf_color: r.leaf_color,
      }));
      if (upsertData.length) {
        await supabase.from('bloom_calendar_plants').upsert(upsertData);
      }
      const toDelete = [...existingIds].filter(eid => !rows.some(r => r.id === eid));
      if (toDelete.length) {
        await supabase.from('bloom_calendar_plants').delete().in('id', toDelete);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    })();
  }, [calendarId, title, centerText, options, climate, rows]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(save, 800);
  }, [save]);

  useEffect(() => { scheduleSave(); }, [scheduleSave, rows, title, centerText, options, climate]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cal, error } = await supabase
        .from('bloom_calendars')
        .select('title, center_text, options, climate')
        .eq('id', calendarId)
        .maybeSingle();

      if (error || !cal) { setLoading(false); return; }

      setTitle(cal.title || '');
      setCenterText(cal.center_text || DEFAULT_OPTIONS.centerText);
      if (cal.options) setOptions({ ...DEFAULT_OPTIONS, ...cal.options });
      if (cal.climate) setClimate({ ...DEFAULT_CLIMATE, ...cal.climate });

      const { data: plantRows } = await supabase
        .from('bloom_calendar_plants')
        .select('id, plant_id, position, custom_name, months_override, bloom_color, leaf_color')
        .eq('calendar_id', calendarId)
        .order('position');

      const loadedRows: CalendarRow[] = [];
      for (const pr of (plantRows || [])) {
        let masterPlant: CalendarPlant | null = null;
        if (pr.plant_id) {
          const { data: plant } = await supabase
            .from('plants_flat')
            .select('*')
            .eq('id', pr.plant_id)
            .maybeSingle();
          if (plant) masterPlant = plantFromDb(plant);
        }
        loadedRows.push({
          id: pr.id,
          plant_id: pr.plant_id,
          position: pr.position,
          custom_name: pr.custom_name,
          months_override: pr.months_override as MonthEntry[] | null,
          bloom_color: pr.bloom_color,
          leaf_color: pr.leaf_color,
          masterPlant,
        });
      }
      setRows(loadedRows);
      setLoading(false);
    })();
  }, [calendarId]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      let query = supabase
        .from('plants_flat')
        .select('id, botanical_name, common_name_de, common_name_en, color_jan, color_feb, color_mar, color_apr, color_may, color_jun, color_jul, color_aug, color_sep, color_oct, color_nov, color_dec, color2_jan, color2_feb, color2_mar, color2_apr, color2_may, color2_jun, color2_jul, color2_aug, color2_sep, color2_oct, color2_nov, color2_dec, characteristic_bees, characteristic_butterflies, characteristic_birds, characteristic_native, characteristic_evergreen, category_perennial, category_grass, category_shrub, category_tree, category_climbing_plant, category_fern, category_medicinal_herbs, category_culinary_plant, usage_medicinal_herbs, tree_of_the_future, tree_of_the_future_drought')
        .or(`botanical_name.ilike.%${searchQuery}%,common_name_de.ilike.%${searchQuery}%,common_name_en.ilike.%${searchQuery}%`)
        .limit(30);

      if (activeCategories.length === 1) {
        query = query.eq(activeCategories[0], true);
      } else if (activeCategories.length > 1) {
        query = query.or(activeCategories.map(c => `${c}.eq.true`).join(','));
      }

      const { data, error } = await query;
      if (error) {
        console.error('Search error:', error);
      }
      setSearchResults((data || []) as SearchResult[]);
      setSearching(false);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, activeCategories]);

  const handleAddPlant = (result: SearchResult) => {
    if (rows.some(r => r.plant_id === result.id)) return;
    const masterPlant = plantFromDb(result);
    setRows(prev => [...prev, {
      id: crypto.randomUUID(),
      plant_id: result.id,
      position: prev.length,
      custom_name: null,
      months_override: null,
      bloom_color: null,
      leaf_color: null,
      masterPlant,
    }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveRow = (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  const cycleMonth = (rowId: string, monthIndex: number) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const master = r.masterPlant;
      const bloom = r.bloom_color || master?.bloom || '#e8bafa';
      const leaf = r.leaf_color || master?.leaf || '#6f9a5a';
      const current = (r.months_override || (master ? master.m : Array(12).fill(null)))[monthIndex];
      const next: MonthEntry = !current ? ['f', leaf]
        : current[0] === 'f' ? ['b', bloom]
        : current[0] === 'b' && current.length < 3 ? ['b', bloom, leaf]
        : null;
      const baseM = r.months_override || (master ? [...master.m] : Array(12).fill(null) as MonthEntry[]);
      const newM = [...baseM];
      newM[monthIndex] = next;
      return { ...r, months_override: newM };
    }));
  };

  const handleColorChange = (rowId: string, type: 'bloom' | 'leaf', color: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const master = r.masterPlant;
      const baseM = r.months_override || (master ? [...master.m] : Array(12).fill(null) as MonthEntry[]);
      const newM = baseM.map((c): MonthEntry => {
        if (!c) return c;
        const arr = c as string[];
        if (type === 'bloom') {
          if (c[0] === 'b') return [c[0], color, ...(arr[2] ? [arr[2]] : [])] as MonthEntry;
          if (arr[2]) return ['b', color, arr[1]] as MonthEntry;
          return c;
        } else {
          if (c[0] === 'f') return ['f', color] as MonthEntry;
          if (arr[2]) return [c[0], arr[1], color] as MonthEntry;
          return c;
        }
      });
      return {
        ...r,
        bloom_color: type === 'bloom' ? color : r.bloom_color,
        leaf_color: type === 'leaf' ? color : r.leaf_color,
        months_override: newM,
      };
    }));
  };

  const handleResetRow = (rowId: string) => {
    setRows(prev => prev.map(r =>
      r.id === rowId ? { ...r, months_override: null, bloom_color: null, leaf_color: null, custom_name: null } : r
    ));
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setRows(prev => {
      const newRows = [...prev];
      const [moved] = newRows.splice(dragIndex, 1);
      newRows.splice(index, 0, moved);
      return newRows;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const fetchClimate = async () => {
    setClimateLoading(true);
    setClimateError(null);
    try {
      const loc = climate.loc;
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=de&format=json`);
      const geoData = await geoRes.json();
      if (!geoData.results || !geoData.results.length) {
        setClimateError(`Location “${loc}” not found.`);
        setClimateLoading(false);
        return;
      }
      const { latitude, longitude } = geoData.results[0];
      const end = new Date();
      const start = new Date(end.getFullYear() - 10, 0, 1);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const archRes = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}` +
        `&start_date=${fmt(start)}&end_date=${fmt(end)}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_mean` +
        `&timezone=auto`
      );
      const archData = await archRes.json();
      if (!archData.daily) {
        setClimateError('Climate data could not be retrieved.');
        setClimateLoading(false);
        return;
      }
      const d = archData.daily;
      const tmax = Array(12).fill(0), tmin = Array(12).fill(0), prec = Array(12).fill(0), wind = Array(12).fill(0);
      const cnt = Array(12).fill(0), windDays = Array(12).fill(0);
      for (let i = 0; i < d.time.length; i++) {
        const m = new Date(d.time[i]).getMonth();
        tmax[m] += d.temperature_2m_max[i] || 0;
        tmin[m] += d.temperature_2m_min[i] || 0;
        prec[m] += d.precipitation_sum[i] || 0;
        if (d.wind_speed_10m_mean[i] > 10) windDays[m]++;
        cnt[m]++;
      }
      for (let m = 0; m < 12; m++) {
        if (cnt[m] > 0) {
          tmax[m] /= cnt[m];
          tmin[m] /= cnt[m];
          prec[m] /= (cnt[m] / 30);
          wind[m] = windDays[m] / 10;
        }
      }
      setClimate({ ...climate, tmax: tmax.map(v => +v.toFixed(1)), tmin: tmin.map(v => +v.toFixed(1)), prec: prec.map(v => Math.round(v)), wind: wind.map(v => +v.toFixed(1)) });
    } catch (e) {
      setClimateError('Error retrieving climate data: ' + (e as Error).message);
    }
    setClimateLoading(false);
  };

  const exportPng = async (scale: number) => {
    setRendering(true);
    try {
      await bluehkalenderReady();
      const off = document.createElement('canvas');
      renderBluehkalender(off, {
        plants: buildPlants(rows),
        climate,
        options: { ...options, title, centerText },
      }, scale);
      off.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BloomCalendar_${title || 'untitled'}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (e) {
      console.error('Export error:', e);
    }
    setRendering(false);
  };

  const monthCellStyle = (entry: MonthEntry | null, bloomColor: string, leafColor: string): React.CSSProperties => {
    if (!entry) return { border: '1px solid #d1d5db', background: '#fff' };
    const arr = entry as string[];
    if (entry[0] === 'f') return { background: entry[1] || leafColor };
    if (entry[0] === 'b' && !arr[2]) return { background: entry[1] || bloomColor };
    if (entry[0] === 'b' && arr[2]) return { background: `linear-gradient(to bottom right, ${arr[2]} 50%, ${entry[1]} 50%)` };
    return { border: '1px solid #d1d5db', background: '#fff' };
  };

  const toggleCategory = (key: string) => {
    setActiveCategories(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const loadProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('id, name').order('updated_at', { ascending: false });
    setProjects((data || []) as { id: string; name: string }[]);
  }, []);

  const loadZones = useCallback(async (projectId: string) => {
    const { data } = await supabase.from('project_zones').select('id, name').eq('project_id', projectId).order('display_order');
    setImportZones((data || []) as { id: string; name: string }[]);
  }, []);

  const handleOpenImport = () => {
    setShowImport(true);
    setImportZoneId(null);
    setImportError(null);
    if (!projects.length) loadProjects();
  };

  const handleSelectProject = (pid: string) => {
    setImportProjectId(pid);
    setImportZoneId(null);
    setImportZones([]);
    if (pid) loadZones(pid);
  };

  const handleImport = async () => {
    if (!importProjectId) return;
    setImporting(true);
    setImportError(null);
    try {
      let query = supabase
        .from('user_selections')
        .select('plant_id, plant:plants_flat(*)')
        .not('plant_id', 'is', null)
        .is('parent_selection_id', null)
        .eq('project_id', importProjectId);
      if (importZoneId) query = query.eq('zone_id', importZoneId);
      const { data, error } = await query;
      if (error) throw error;
      const plants = (data || []).map((r: { plant_id: number; plant: Record<string, unknown> }) => r.plant as Record<string, unknown>).filter(Boolean);
      const newRows: CalendarRow[] = [];
      for (const p of plants) {
        const pid = p.id as number;
        if (rows.some(r => r.plant_id === pid) || newRows.some(r => r.plant_id === pid)) continue;
        newRows.push({
          id: crypto.randomUUID(),
          plant_id: pid,
          position: rows.length + newRows.length,
          custom_name: null,
          months_override: null,
          bloom_color: null,
          leaf_color: null,
          masterPlant: plantFromDb(p),
        });
      }
      if (newRows.length) setRows(prev => [...prev, ...newRows]);
      setShowImport(false);
    } catch (e) {
      setImportError('Import failed: ' + (e as Error).message);
    }
    setImporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/bluehkalender')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-cyan-600">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs text-gray-400">
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : ''}
        </span>
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 mb-6">
        <canvas ref={canvasRef} className="w-full block" />
        {rendering && (
          <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
            Rendering …
          </div>
        )}
      </div>

      {/* a) Labels */}
      <section className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Labels</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-gray-500">Title above the text (optional)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Center text</label>
            <textarea value={centerText} onChange={e => setCenterText(e.target.value)} rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 mr-2">
            <span className="text-xs text-gray-500 mr-1">Language</span>
            {(['de','en'] as const).map(lang => (
              <button key={lang} onClick={() => setOptions(prev => ({ ...prev, language: lang }))}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${options.language === lang ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          {([
            ['showLogo', 'Show Enea logo'],
            ['showPlantList', 'Show plant list in circle'],
            ['showMonths', 'Show month names'],
            ['showFauna', 'Show fauna and traits'],
            ['showSide', 'Show plant list and legend on the right'],
            ['showClimate', 'Show climate'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={options[key]} onChange={e => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
              {label}
            </label>
          ))}
        </div>
      </section>

      {/* b) Plants hinzufügen */}
      <section className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Add plant</h2>
          <button onClick={handleOpenImport}
            className="flex items-center gap-2 rounded-lg border border-cyan-600 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-600 hover:bg-cyan-50">
            <FolderInput className="w-3.5 h-3.5" />
            Import from project
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Botanical or common name…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {CATEGORY_FILTERS.map(cat => (
            <button key={cat.key} onClick={() => toggleCategory(cat.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${activeCategories.includes(cat.key) ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {cat.label}
            </button>
          ))}
        </div>
        {searchResults.length > 0 && (
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {searchResults.map((r, i) => {
              const mp = plantFromDb(r);
              return (
                <div key={r.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-cyan-50 ${i > 0 ? 'border-t border-gray-100' : ''} ${rows.some(rr => rr.plant_id === r.id) ? 'opacity-40' : ''}`}
                  onClick={() => handleAddPlant(r)}>
                  <div className="flex gap-0.5">
                    {mp.m.map((c, mi) => {
                      const ca = c as string[] | null;
                      return (
                      <div key={mi} className="w-2 h-4 rounded-sm" style={ca ? { background: ca[0] === 'f' ? ca[1] : ca[2] ? `linear-gradient(to bottom right, ${ca[2]} 50%, ${ca[1]} 50%)` : ca[1] } : { background: '#f3f4f6' }} />
                      );
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.botanical_name}</p>
                    <p className="text-xs text-gray-500 truncate">{r.common_name_de || r.common_name_en || ''}</p>
                  </div>
                  <Plus className="w-4 h-4 text-cyan-600 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Import-Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowImport(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Import plants from project</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Project</label>
                <select value={importProjectId || ''} onChange={e => handleSelectProject(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none">
                  <option value="">— Choose project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {importZones.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500">Zone (optional)</label>
                  <select value={importZoneId || ''} onChange={e => setImportZoneId(e.target.value || null)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none">
                    <option value="">— All plants in project —</option>
                    {importZones.map(z => <option key={z.id} value={z.id}>{z.name || 'Unnamed zone'}</option>)}
                  </select>
                </div>
              )}
              {importError && <p className="text-xs text-red-600">{importError}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowImport(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={handleImport} disabled={!importProjectId || importing}
                className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderInput className="w-4 h-4" />}
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* c) Plantstabelle */}
      <section className="mb-6 bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Plants</h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-200" /> Bloom</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-300" /> Foliage</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm border border-gray-300 bg-white" /> empty</span>
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No plants added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500">
                <th className="py-2 px-1 text-left w-8"></th>
                <th className="py-2 px-2 text-left">Name</th>
                <th className="py-2 px-2 text-left">Botanical</th>
                {MSHORT(options.language).map((m, i) => <th key={i} className="py-2 px-1 text-center w-8">{m}</th>)}
                <th className="py-2 px-2 text-center">Bloom</th>
                <th className="py-2 px-2 text-center">Foliage</th>
                <th className="py-2 px-1"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => {
                const mp = r.masterPlant;
                const displayM = r.months_override || (mp ? mp.m : Array(12).fill(null));
                const bloom = r.bloom_color || mp?.bloom || '#e8bafa';
                const leaf = r.leaf_color || mp?.leaf || '#6f9a5a';
                const hasOverride = !!(r.months_override || r.bloom_color || r.leaf_color || r.custom_name);
                return (
                  <tr key={r.id} draggable onDragStart={() => handleDragStart(ri)} onDragOver={(e) => handleDragOver(e, ri)} onDrop={(e) => handleDrop(e, ri)}
                    className={`border-b border-gray-100 ${dragOverIndex === ri ? 'bg-cyan-50' : ''}`}>
                    <td className="py-2 px-1 cursor-grab text-gray-300 hover:text-gray-500"><GripVertical className="w-4 h-4" /></td>
                    <td className="py-2 px-2 font-medium text-gray-800">{r.custom_name || mp?.en || mp?.bot || '?'}</td>
                    <td className="py-2 px-2 text-gray-500 italic text-xs">{mp?.bot || '—'}</td>
                    {displayM.map((c, mi) => (
                      <td key={mi} className="py-1 px-1 text-center">
                        <button onClick={() => cycleMonth(r.id, mi)} className="w-6 h-6 rounded-sm border border-gray-200" style={monthCellStyle(c, bloom, leaf)} title={MSHORT(options.language)[mi]} />
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center">
                      <input type="color" value={bloom} onChange={e => handleColorChange(r.id, 'bloom', e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input type="color" value={leaf} onChange={e => handleColorChange(r.id, 'leaf', e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
                    </td>
                    <td className="py-2 px-1">
                      <div className="flex items-center gap-1">
                        {hasOverride && (
                          <button onClick={() => handleResetRow(r.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-cyan-600" title="Reset to master data">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleRemoveRow(r.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* d) Klima */}
      <section className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Local climate</h2>
          <button onClick={fetchClimate} disabled={climateLoading}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
            {climateLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Fetch climate data
          </button>
        </div>
        {climateError && <p className="text-xs text-red-600 mb-3">{climateError}</p>}
        <div className="grid gap-3 sm:grid-cols-4 mb-3">
          <div>
            <label className="text-xs text-gray-500">Location</label>
            <input type="text" value={climate.loc} onChange={e => setClimate(prev => ({ ...prev, loc: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Frost at ≤ °C</label>
            <input type="number" value={climate.th.frost} onChange={e => setClimate(prev => ({ ...prev, th: { ...prev.th, frost: +e.target.value } }))}
              className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Warm at ≥ °C</label>
            <input type="number" value={climate.th.warm} onChange={e => setClimate(prev => ({ ...prev, th: { ...prev.th, warm: +e.target.value } }))}
              className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Wet from mm</label>
            <input type="number" value={climate.th.wet} onChange={e => setClimate(prev => ({ ...prev, th: { ...prev.th, wet: +e.target.value } }))}
              className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="py-1 px-2 text-left"></th>
                {MSHORT(options.language).map((m, i) => <th key={i} className="py-1 px-2 text-center">{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {([
                ['tmax', 'Maximum °C'],
                ['tmin', 'Minimum °C'],
                ['prec', 'Precipitation mm'],
                ['wind', 'Wind days >10 km/h'],
              ] as const).map(([key, label]) => (
                <tr key={key}>
                  <td className="py-1 px-2 text-gray-500 whitespace-nowrap">{label}</td>
                  {(climate[key] as number[]).map((val, mi) => (
                    <td key={mi} className="py-1 px-1">
                      <input type="number" value={val} step="0.1"
                        onChange={e => setClimate(prev => ({ ...prev, [key]: (prev[key] as number[]).map((v, i) => i === mi ? +e.target.value : v) }))}
                        className="w-14 rounded border border-gray-200 px-1 py-0.5 text-center focus:border-cyan-500 focus:outline-none" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* e) Export */}
      <section className="mb-6 flex flex-wrap gap-3">
        <button onClick={() => exportPng(1)} disabled={!rows.length}
          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
          <Download className="w-4 h-4" />
          Save as PNG (A3)
        </button>
        <button onClick={() => exportPng(2)} disabled={!rows.length}
          className="flex items-center gap-2 rounded-lg border border-cyan-600 bg-white px-4 py-2 text-sm font-semibold text-cyan-600 hover:bg-cyan-50 disabled:opacity-50">
          <Download className="w-4 h-4" />
          PNG for print (300 dpi)
        </button>
      </section>
    </div>
  );
};
