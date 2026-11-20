import { useEffect, useMemo, useState } from 'react';
import { exportMoodboardPdf } from '../../lib/moodboard/pdf';
import { generateMoodboard, replaceSlot, slotAlternatives, validateSelection } from '../../lib/moodboard/fill';
import { LAYOUTS, MOODBOARD_TYPES, type PaperFormat } from '../../lib/moodboard/layouts';
import type { MoodboardImage, MoodboardPage, MoodboardPlant, MoodboardType } from '../../lib/moodboard/types';
import { MoodboardPreview } from './MoodboardPreview';

export interface MoodboardExportDialogProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  plants: MoodboardPlant[];
  loadImages: (plantIds: (string | number)[]) => Promise<MoodboardImage[]>;
}

const key = (id: string | number) => String(id);

const SEASONS = [
  { tag: 'fruehling', short: 'F', label: 'Frühling' },
  { tag: 'sommer', short: 'S', label: 'Sommer' },
  { tag: 'herbst', short: 'H', label: 'Herbst' },
  { tag: 'winter', short: 'W', label: 'Winter' },
] as const;

const SOURCE_LABELS: Record<NonNullable<MoodboardImage['matchSource']>, string> = {
  ordner: 'Artordner',
  dateiname: 'Dateiname',
  saisonordner: 'Saisonordner',
  tag: 'Tag',
  gattung: 'nur Gattung',
};

/** Image counts per plant, shown next to each plant so gaps are visible before generating. */
function plantStats(images: MoodboardImage[], plantId: string | number) {
  const own = images.filter(image => key(image.plantId) === key(plantId));
  return {
    total: own.length,
    curated: own.filter(image => image.matchSource && image.matchSource !== 'tag' && image.matchSource !== 'gattung').length,
    genusOnly: own.filter(image => image.matchSource === 'gattung').length,
    seasons: SEASONS.map(season => own.filter(image => image.tags.includes(season.tag)).length),
  };
}

export function MoodboardExportDialog({ open, onClose, projectName, plants, loadImages }: MoodboardExportDialogProps) {
  const [type, setType] = useState<MoodboardType>('saison');
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [onePagePerPlant, setOnePagePerPlant] = useState(true);
  const [images, setImages] = useState<MoodboardImage[]>([]);
  const [pages, setPages] = useState<MoodboardPage[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [seed, setSeed] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<PaperFormat>('a3');
  const [header, setHeader] = useState({ project: projectName, concept: 'Konzeptpräsentation', area: LAYOUTS.saison.subtitle });
  const [exporting, setExporting] = useState<{ done: number; total: number } | null>(null);
  const [exportNote, setExportNote] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPages([]);
    setExportNote(null);
    setHeader(h => ({ ...h, project: projectName }));
    loadImages(plants.map(p => p.id))
      .then(result => { if (!cancelled) setImages(result); })
      .catch(err => { console.error(err); if (!cancelled) setError('Bilder konnten nicht geladen werden.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, projectName, plants, loadImages]);

  useEffect(() => { if (open) setChosen(new Set(plants.map(p => key(p.id)))); }, [open, plants]);

  const selected = useMemo(() => plants.filter(p => chosen.has(key(p.id))), [plants, chosen]);
  const warnings = useMemo(() => validateSelection(type, selected, images, onePagePerPlant), [type, selected, images, onePagePerPlant]);
  const stats = useMemo(() => new Map(plants.map(p => [key(p.id), plantStats(images, p.id)])), [plants, images]);

  const page = pages[pageIndex];
  const alternatives = useMemo(() => {
    if (!page || !selectedSlot) return [];
    return slotAlternatives(page, selectedSlot, selected, images, pages)
      .sort((a, b) => (b.image.relevance ?? 0) - (a.image.relevance ?? 0))
      .slice(0, 80);
  }, [page, selectedSlot, selected, images, pages]);
  const currentImageId = page?.slots.find(s => s.slotId === selectedSlot)?.image?.id;

  if (!open) return null;

  const chooseType = (next: MoodboardType) => {
    setType(next);
    setHeader(h => ({ ...h, area: LAYOUTS[next].subtitle }));
    setChosen(new Set(plants.filter(p => next !== 'pflanzenauswahl' || p.group).map(p => key(p.id))));
  };
  const togglePlant = (id: string) => setChosen(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const build = (nextSeed: number) => {
    setSeed(nextSeed);
    setPages(generateMoodboard(type, selected, images, { seed: nextSeed, onePagePerPlant }));
    setSelectedSlot(null);
  };
  const generate = () => { setPageIndex(0); build(0); };
  const reshuffle = () => build(seed + 1 + Math.floor(Math.random() * 1000));
  const choose = (image: MoodboardImage | null, plant: MoodboardPlant | null) => {
    if (!selectedSlot) return;
    setPages(prev => replaceSlot(prev, pageIndex, selectedSlot, image, plant));
  };
  const exportPdf = async () => {
    const failed: string[] = [];
    setExportNote(null);
    setExporting({ done: 0, total: 0 });
    try {
      await exportMoodboardPdf(pages, {
        header,
        format,
        logoUrl: '/enea-logo%20copy.png',
        markUrl: '/enea-mark.png',
        onProgress: (done, total) => setExporting({ done, total }),
        onImageError: url => failed.push(url),
      });
      setExportNote(failed.length
        ? `${failed.length} Bild(er) konnten nicht geladen werden und sind im PDF grau. Bitte diese Felder tauschen.`
        : 'PDF wurde erstellt.');
    } catch (err) {
      console.error(err);
      setExportNote('PDF konnte nicht erstellt werden.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Moodboard erstellen</h2>
          <button onClick={onClose} className="rounded border px-3 py-1 text-sm">Schliessen</button>
        </div>

        <div className="overflow-y-auto p-5">
          {loading && <p className="text-sm text-gray-600">Bilder werden aus der Bildersuche geladen …</p>}
          {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {!loading && pages.length === 0 && (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                {MOODBOARD_TYPES.map(option => (
                  <button key={option} onClick={() => chooseType(option)}
                    className={`rounded-lg border p-4 text-left hover:border-emerald-600 ${type === option ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700' : ''}`}>
                    <b>{LAYOUTS[option].name}</b>
                    <p className="mt-1 text-sm text-gray-600">{LAYOUTS[option].description}</p>
                    <p className="mt-1 text-xs text-gray-500">Empfohlen: {LAYOUTS[option].recommendedPlants}</p>
                  </button>
                ))}
              </div>

              {type === 'portrait' && (
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={onePagePerPlant} onChange={e => setOnePagePerPlant(e.target.checked)} />
                  Eine Seite pro Pflanze (aus: alle gewählten Pflanzen auf einer Seite)
                </label>
              )}

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_300px]">
                <div className="divide-y rounded border">
                  {plants.map(plant => {
                    const s = stats.get(key(plant.id))!;
                    return (
                      <label key={plant.id} className="flex items-center gap-3 p-3">
                        <input type="checkbox" checked={chosen.has(key(plant.id))} onChange={() => togglePlant(key(plant.id))} />
                        <span className="flex-1">
                          <i>{plant.botanicalName}</i>
                          <small className="block text-gray-500">{plant.commonName}</small>
                        </span>
                        <span className="text-right text-xs text-gray-500">
                          <span className={s.total === 0 ? 'font-semibold text-red-700' : ''}>{s.total} Bilder</span>
                          {s.total > 0 && <span className="block">{s.curated} aus Ordnern{s.genusOnly ? `, ${s.genusOnly} nur Gattung` : ''}</span>}
                          {type === 'saison' && (
                            <span className="block font-mono" title="Bilder pro Jahreszeit: Frühling, Sommer, Herbst, Winter">
                              {SEASONS.map((season, i) => (
                                <span key={season.tag} className={s.seasons[i] === 0 ? 'text-red-600' : ''}>{season.short}{s.seasons[i]} </span>
                              ))}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <aside>
                  <ul className="space-y-2">
                    {warnings.map((warning, index) => (
                      <li key={index} className={`rounded p-2 text-sm ${warning.level === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                  <button disabled={warnings.some(w => w.level === 'error')} onClick={generate}
                    className="mt-4 w-full rounded bg-emerald-700 px-3 py-2 font-semibold text-white disabled:bg-gray-300">
                    Vorschau erstellen
                  </button>
                </aside>
              </div>
            </>
          )}

          {page && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <input value={header.project} onChange={e => setHeader({ ...header, project: e.target.value })} className="rounded border px-2 py-1" placeholder="Projekt" />
                <input value={header.concept} onChange={e => setHeader({ ...header, concept: e.target.value })} className="rounded border px-2 py-1" placeholder="Konzept" />
                <input value={header.area} onChange={e => setHeader({ ...header, area: e.target.value })} className="rounded border px-2 py-1" placeholder="Bereich" />
                <select value={format} onChange={e => setFormat(e.target.value as PaperFormat)} className="rounded border px-2 py-1">
                  <option value="a3">A3 quer</option>
                  <option value="a4">A4 quer</option>
                </select>
                <button onClick={reshuffle} className="rounded border px-3 py-1" title="Andere, ähnlich passende Bilder wählen">Neu mischen</button>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div>
                  <MoodboardPreview page={page} header={header} pageNumber={pageIndex + 1}
                    selectedSlotId={selectedSlot} onSlotClick={slotId => setSelectedSlot(slotId === selectedSlot ? null : slotId)} />
                  {pages.length > 1 && (
                    <div className="mt-3 flex items-center justify-center gap-3 text-sm">
                      <button disabled={pageIndex === 0} onClick={() => { setPageIndex(pageIndex - 1); setSelectedSlot(null); }} className="rounded border px-3 py-1 disabled:opacity-40">‹ Zurück</button>
                      <span>Seite {pageIndex + 1} von {pages.length}{page.plant ? ` · ${page.plant.botanicalName}` : ''}</span>
                      <button disabled={pageIndex === pages.length - 1} onClick={() => { setPageIndex(pageIndex + 1); setSelectedSlot(null); }} className="rounded border px-3 py-1 disabled:opacity-40">Weiter ›</button>
                    </div>
                  )}
                </div>

                <aside className="rounded border p-3 text-sm">
                  {!selectedSlot && <p className="text-gray-600">Klicke auf ein Bild in der Vorschau, um es zu tauschen oder das Feld zu leeren.</p>}
                  {selectedSlot && (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <b>Bild wählen</b>
                        <button onClick={() => choose(null, null)} className="rounded border px-2 py-0.5 text-xs">Feld leeren</button>
                      </div>
                      {alternatives.length === 0 && <p className="text-gray-600">Keine weiteren passenden Bilder.</p>}
                      <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto">
                        {alternatives.map(({ image, plant }) => (
                          <button key={image.id} onClick={() => choose(image, plant)}
                            title={image.path ?? image.url}
                            className={`overflow-hidden rounded border text-left ${image.id === currentImageId ? 'ring-2 ring-emerald-600' : 'hover:border-emerald-600'}`}>
                            <img src={image.url} alt={plant.botanicalName} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                            <span className="block truncate px-1 pt-0.5 text-[11px] italic">{plant.botanicalName}</span>
                            <span className="block px-1 pb-0.5 text-[10px] text-gray-500">
                              {image.matchSource ? SOURCE_LABELS[image.matchSource] : ''}
                              {image.seasonCertain === false && SEASONS.some(s => image.tags.includes(s.tag)) ? ' · Saison geschätzt' : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </aside>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button onClick={() => { setPages([]); setSelectedSlot(null); }} className="rounded border px-3 py-2">Pflanzen ändern</button>
                <button onClick={exportPdf} disabled={!!exporting} className="rounded bg-emerald-700 px-3 py-2 font-semibold text-white disabled:bg-gray-300">
                  {exporting ? `PDF wird erstellt … ${exporting.done}/${exporting.total || '…'}` : 'PDF exportieren'}
                </button>
                {exportNote && <span className="text-sm text-gray-700">{exportNote}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
