import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TreePine, ClipboardCopy, FileDown, Calculator, ListPlus, FolderOpen } from 'lucide-react';
import { SiteParamsPanel, GeoStatus } from '../components/TreeBenefits/SiteParamsPanel';
import { ProjectTreesInput } from '../components/TreeBenefits/ProjectTreesInput';
import { ResultsSummary } from '../components/TreeBenefits/ResultsSummary';
import { ResultsTable } from '../components/TreeBenefits/ResultsTable';
import { ProjectionSection } from '../components/TreeBenefits/ProjectionSection';
import { MethodSection } from '../components/TreeBenefits/MethodSection';
import { makeT, loadLang, saveLang } from '../lib/treeBenefits/i18n';
import { DEFAULT_PARAMS, calcAll, totals as calcTotals } from '../lib/treeBenefits/calc';
import { PRESETS, DEFAULT_PRESET, applyPresetToParams, liveLookup, LiveLookupError } from '../lib/treeBenefits/presets';
import { parseTreeList, SAMPLE_INPUT } from '../lib/treeBenefits/parse';
import { loadSizeClasses, saveSizeClasses, expandProjectTrees, fetchSpeciesSizeClasses } from '../lib/treeBenefits/sizeClasses';
import { loadHandover, saveHandover } from '../lib/treeBenefits/handover';
import { buildExcelText, copyToClipboard } from '../lib/treeBenefits/columns';
import { exportTreeBenefitsPdf } from '../lib/treeBenefits/pdf';
import { DbhUnit, Lang, ProjectHandover, ProjectTreeInput, SiteInfo, SiteParams, SizeClassKey, SizeClassStandard } from '../lib/treeBenefits/types';

type Mode = 'paste' | 'project';

const SITE_KEYS: (keyof SiteParams)[] = ['cO3', 'cNO2', 'cSO2', 'cPM', 'cCO', 'precip', 'raindays', 'ffd', 'leafon'];

export const TreeBenefitsPage: React.FC = () => {
  const location = useLocation();
  const [lang, setLang] = useState<Lang>(loadLang);
  const T = useMemo(() => makeT(lang), [lang]);

  // handover from the selections page: router state wins, session storage keeps it across reloads
  const [handover, setHandover] = useState<ProjectHandover | null>(() => {
    const st = (location.state as { handover?: ProjectHandover } | null)?.handover;
    if (st) { saveHandover(st); return st; }
    return loadHandover();
  });
  useEffect(() => {
    const st = (location.state as { handover?: ProjectHandover } | null)?.handover;
    if (st) { saveHandover(st); setHandover(st); setProjectTrees(st.trees); setMode('project'); }
  }, [location.state]);

  const [mode, setMode] = useState<Mode>(handover ? 'project' : 'paste');
  const [text, setText] = useState(SAMPLE_INPUT);
  const [committedText, setCommittedText] = useState(SAMPLE_INPUT);
  const [unit, setUnit] = useState<DbhUnit>('cm');
  const [projectTrees, setProjectTrees] = useState<ProjectTreeInput[]>(handover?.trees ?? []);
  const [sizeClasses, setSizeClasses] = useState<Record<SizeClassKey, SizeClassStandard>>(loadSizeClasses);
  const [speciesOverrides, setSpeciesOverrides] = useState<Map<string, SizeClassStandard>>(new Map());

  const [params, setParams] = useState<SiteParams>(DEFAULT_PARAMS);
  const [presetId, setPresetId] = useState(DEFAULT_PRESET.id);
  const [site, setSite] = useState<SiteInfo>({ name: DEFAULT_PRESET.name, elev: DEFAULT_PRESET.elev, src: 'preset' });
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoStatus, setGeoStatus] = useState<GeoStatus | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const showToast = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2000); }, []);
  const switchLang = (l: Lang) => { setLang(l); saveLang(l); };
  const changeSizeClasses = (c: Record<SizeClassKey, SizeClassStandard>) => { setSizeClasses(c); saveSizeClasses(c); };

  const onParamChange = (key: keyof SiteParams, value: number) => {
    setParams(p => ({ ...p, [key]: value }));
    if (SITE_KEYS.includes(key)) { setPresetId('custom'); setSite(s => ({ ...s, src: 'custom' })); setGeoStatus(null); }
  };
  const onPreset = (id: string) => {
    setPresetId(id);
    const p = PRESETS.find(x => x.id === id);
    if (!p) return;
    setParams(cur => applyPresetToParams(cur, p));
    setSite({ name: p.name, elev: p.elev, src: 'preset' });
    setGeoStatus({ text: T('presetNote', p.name), err: false });
  };
  const onLiveLookup = async (q: string) => {
    setGeoBusy(true); setGeoStatus({ text: T('geoBusy'), err: false });
    try {
      const r = await liveLookup(q, lang);
      setParams(cur => applyPresetToParams(cur, r));
      setPresetId('custom');
      setSite({ name: r.name, elev: r.elev, src: 'live' });
      let note = T('geoOk', r.name, r.elev);
      for (const fb of r.fallback) { const [what, name] = fb.split(':'); note += ' ' + T(what === 'climate' ? 'fbClimate' : 'fbAir', name); }
      setGeoStatus({ text: note, err: r.fallback.length > 0 });
    } catch (e) {
      const kind = e instanceof LiveLookupError ? e.kind : 'network';
      setGeoStatus({ text: T(kind === 'none' ? 'geoNone' : kind === 'offline' ? 'geoOffline' : 'geoBlocked'), err: true });
    } finally {
      setGeoBusy(false);
    }
  };

  // Fetch species-specific size class overrides from the database when in project mode
  useEffect(() => {
    if (mode !== 'project') return;
    const ids = projectTrees.map(t => t.plantId).filter((id): id is number => typeof id === 'number' && id > 0);
    if (ids.length === 0) { setSpeciesOverrides(new Map()); return; }
    let cancelled = false;
    fetchSpeciesSizeClasses(ids).then(map => { if (!cancelled) setSpeciesOverrides(map); });
    return () => { cancelled = true; };
  }, [mode, projectTrees]);

  // input trees depending on the mode
  const inputTrees = useMemo(
    () => (mode === 'project' ? expandProjectTrees(projectTrees, sizeClasses, speciesOverrides) : parseTreeList(committedText)),
    [mode, projectTrees, sizeClasses, speciesOverrides, committedText]
  );
  const { rows, skipped } = useMemo(() => calcAll(inputTrees, mode === 'project' ? 'cm' : unit, params), [inputTrees, unit, params, mode]);
  const totals = useMemo(() => calcTotals(rows, params), [rows, params]);
  const hasClass = mode === 'project';

  useEffect(() => {
    setStatus(rows.length ? T('status', rows.length, new Date().toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB')) : '');
  }, [rows.length, T, lang]);

  const onCopy = async () => {
    if (!rows.length) return showToast(T('tFirst'));
    await copyToClipboard(buildExcelText(rows, T, lang, params, hasClass));
    showToast(T('tCopied'));
  };
  const onPdf = () => {
    if (!rows.length) return showToast(T('tFirst'));
    showToast(T('pdfBusy'));
    try {
      const r = exportTreeBenefitsPdf({
        rows, skipped, params, site, lang,
        sizeClasses: hasClass ? sizeClasses : undefined,
        projectName: mode === 'project' ? [handover?.projectName, handover?.zoneName].filter(Boolean).join(' — ') || undefined : undefined,
      });
      setStatus(`PDF ${r.pages} ${lang === 'de' ? 'Seiten' : 'pages'} · ${r.name}`);
      showToast(T('pdfSaved'));
    } catch (e) {
      console.error('PDF build failed', e);
      showToast(`${T('pdfErr')}: ${String((e as Error)?.message || e)}`);
    }
  };

  const tabCls = (m: Mode) => `flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${mode === m ? 'bg-[#2F7041] text-white' : 'text-gray-600 hover:bg-gray-100'}`;
  const langCls = (l: Lang) => `rounded-full px-3 py-1 text-xs font-semibold transition-colors ${lang === l ? 'bg-white text-[#245A34]' : 'text-white/80 hover:text-white'}`;

  return (
    <div className="min-h-screen" lang={lang}>
      <div className="border-b border-[#1E4F2D] bg-[#2F7041] p-3 shadow-sm md:p-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"><TreePine className="h-6 w-6 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold text-white md:text-2xl">{T('title')}</h1>
              <p className="text-xs text-white/90 md:text-sm">{T('subtitle')}</p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3 lg:justify-end">
            <span className="font-mono text-xs text-white/80">{site.name} · {site.elev} m</span>
            <div className="inline-flex rounded-full border border-white/40 p-0.5" role="group" aria-label="Sprache / Language">
              <button onClick={() => switchLang('de')} aria-pressed={lang === 'de'} className={langCls('de')}>Deutsch</button>
              <button onClick={() => switchLang('en')} aria-pressed={lang === 'en'} className={langCls('en')}>English</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside>
            <div className="mb-2.5 flex items-baseline gap-2">
              <span className="rounded border border-[#9FBEA5] px-1.5 font-mono text-[11px] leading-[18px] text-[#245A34]">1</span>
              <h2 className="text-lg font-semibold text-gray-900">{T('s1')}</h2>
            </div>
            <SiteParamsPanel
              T={T} params={params} onParamChange={onParamChange}
              presetId={presetId} onPreset={onPreset}
              onLiveLookup={onLiveLookup} geoBusy={geoBusy} geoStatus={geoStatus}
            />
          </aside>

          <main>
            <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="rounded border border-[#9FBEA5] px-1.5 font-mono text-[11px] leading-[18px] text-[#245A34]">2</span>
                <h2 className="text-lg font-semibold text-gray-900">{T('s2')}</h2>
              </div>
              <div className="inline-flex rounded-full border border-gray-300 bg-white p-0.5">
                <button type="button" onClick={() => setMode('project')} className={tabCls('project')}><FolderOpen className="h-3.5 w-3.5" />{T('modeProject')}</button>
                <button type="button" onClick={() => setMode('paste')} className={tabCls('paste')}><ListPlus className="h-3.5 w-3.5" />{T('modePaste')}</button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
              {mode === 'paste' ? (
                <>
                  <p className="mb-2.5 text-xs text-gray-500">{T('inputHint')}</p>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    spellCheck={false}
                    className="min-h-[150px] w-full resize-y rounded border border-gray-300 bg-gray-50 p-2.5 font-mono text-[12.5px] leading-snug focus:border-[#E4F0E6]0 focus:outline-none"
                  />
                </>
              ) : (
                <ProjectTreesInput T={T} handover={handover} trees={projectTrees} onChange={setProjectTrees} classes={sizeClasses} onClassesChange={changeSizeClasses} />
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {mode === 'paste' && (
                  <>
                    <label className="mr-auto flex items-center gap-2 text-xs text-gray-500">
                      <span>{T('dbhUnit')}</span>
                      <select value={unit} onChange={e => setUnit(e.target.value as DbhUnit)} className="rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm text-gray-800 focus:border-[#E4F0E6]0 focus:outline-none">
                        <option value="cm">{T('uCm')}</option>
                        <option value="mm">{T('uMm')}</option>
                        <option value="circ">{T('uCirc')}</option>
                      </select>
                    </label>
                    <button type="button" onClick={() => setCommittedText(text)} className="flex items-center gap-1.5 rounded-lg bg-[#2F7041] px-4 py-2 text-sm font-semibold text-white hover:bg-[#245A34]">
                      <Calculator className="h-4 w-4" /> {T('calc')}
                    </button>
                  </>
                )}
                <button type="button" onClick={onCopy} disabled={!rows.length} className="flex items-center gap-1.5 rounded-lg border border-[#2F7041] bg-white px-4 py-2 text-sm font-semibold text-[#245A34] hover:bg-[#E4F0E6] disabled:opacity-50">
                  <ClipboardCopy className="h-4 w-4" /> {T('copy')}
                </button>
                <button type="button" onClick={onPdf} disabled={!rows.length} className="flex items-center gap-1.5 rounded-lg border border-[#2F7041] bg-white px-4 py-2 text-sm font-semibold text-[#245A34] hover:bg-[#E4F0E6] disabled:opacity-50">
                  <FileDown className="h-4 w-4" /> {T('pdf')}
                </button>
                <span className="basis-full font-mono text-xs text-gray-500 md:ml-auto md:basis-auto">{status}</span>
              </div>
            </div>

            {rows.length > 0 && (
              <>
                <ResultsSummary T={T} lang={lang} totals={totals} count={rows.length} skipped={skipped.length} />
                <ProjectionSection T={T} lang={lang} rows={rows} params={params} totals={totals} />
              </>
            )}

            <div className="mb-2.5 mt-6 flex items-baseline gap-2">
              <span className="rounded border border-[#9FBEA5] px-1.5 font-mono text-[11px] leading-[18px] text-[#245A34]">3</span>
              <h2 className="text-lg font-semibold text-gray-900">{T('s3')}</h2>
            </div>
            <ResultsTable T={T} lang={lang} rows={rows} skipped={skipped} params={params} hasClass={hasClass} />

            <MethodSection T={T} />
          </main>
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md bg-gray-900 px-3.5 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
};
