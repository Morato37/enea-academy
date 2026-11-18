import { useEffect, useMemo, useState } from 'react';
import { exportMoodboardPdf } from '../../lib/moodboard/pdf';
import { generateMoodboard, validateSelection } from '../../lib/moodboard/fill';
import { LAYOUTS, MOODBOARD_TYPES, type PaperFormat } from '../../lib/moodboard/layouts';
import type { MoodboardImage, MoodboardPlant, MoodboardType } from '../../lib/moodboard/types';
import { MoodboardPreview } from './MoodboardPreview';

export interface MoodboardExportDialogProps { open: boolean; onClose: () => void; projectName: string; plants: MoodboardPlant[]; loadImages: (plantIds: (string | number)[]) => Promise<MoodboardImage[]>; }
const key = (id: string | number) => String(id);

export function MoodboardExportDialog({ open, onClose, projectName, plants, loadImages }: MoodboardExportDialogProps) {
  const [type, setType] = useState<MoodboardType>('saison');
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [images, setImages] = useState<MoodboardImage[]>([]);
  const [pages, setPages] = useState<ReturnType<typeof generateMoodboard>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<PaperFormat>('a3');
  const [header, setHeader] = useState({ project: projectName, concept: 'Konzeptpräsentation', area: '' });

  useEffect(() => { if (!open) return; setLoading(true); setError(null); setHeader(h => ({ ...h, project: projectName })); loadImages(plants.map(p => p.id)).then(setImages).catch(() => setError('Bilder konnten nicht geladen werden.')).finally(() => setLoading(false)); }, [open, projectName, plants, loadImages]);
  useEffect(() => { if (open) setChosen(new Set(plants.map(p => key(p.id)))); }, [open, plants]);
  const selected = useMemo(() => plants.filter(p => chosen.has(key(p.id))), [plants, chosen]);
  const warnings = validateSelection(type, selected, images);
  const chooseType = (next: MoodboardType) => { setType(next); setChosen(new Set(plants.filter(p => next !== 'pflanzenauswahl' || p.group).map(p => key(p.id)))); };
  const generate = () => setPages(generateMoodboard(type, selected, images));
  const exportPdf = async () => { await exportMoodboardPdf(pages, { header, format, logoUrl: '/enea-logo%20copy.png', markUrl: '/enea-mark.png' }); };
  if (!open) return null;
  return <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4"><div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-4"><h2 className="text-lg font-semibold">Moodboard erstellen</h2><button onClick={onClose} className="rounded border px-3 py-1 text-sm">Schliessen</button></div><div className="overflow-y-auto p-5">{loading && <p className="text-sm text-gray-600">Bilder werden geladen …</p>}{error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>} {!loading && pages.length === 0 && <><div className="grid gap-3 md:grid-cols-3">{MOODBOARD_TYPES.map(option => <button key={option} onClick={() => chooseType(option)} className="rounded-lg border p-4 text-left hover:border-emerald-600"><b>{LAYOUTS[option].name}</b><p className="mt-1 text-sm text-gray-600">{LAYOUTS[option].description}</p></button>)}</div><div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]"><div className="divide-y rounded border">{plants.map(plant => <label key={plant.id} className="flex items-center gap-3 p-3"><input type="checkbox" checked={chosen.has(key(plant.id))} onChange={() => setChosen(prev => { const next = new Set(prev); next.has(key(plant.id)) ? next.delete(key(plant.id)) : next.add(key(plant.id)); return next; })} /><span className="flex-1"><i>{plant.botanicalName}</i><small className="block text-gray-500">{plant.commonName}</small></span><small className="text-gray-500">{images.filter(image => key(image.plantId) === key(plant.id)).length} Bilder</small></label>)}</div><aside><ul className="space-y-2">{warnings.map((warning, index) => <li key={index} className={`rounded p-2 text-sm ${warning.level === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{warning.message}</li>)}</ul><button disabled={warnings.some(w => w.level === 'error')} onClick={generate} className="mt-4 w-full rounded bg-emerald-700 px-3 py-2 font-semibold text-white disabled:bg-gray-300">Vorschau erstellen</button></aside></div></>}{pages.length > 0 && <><div className="mb-4 flex gap-2"><input value={header.project} onChange={e => setHeader({ ...header, project: e.target.value })} className="rounded border px-2 py-1" /><input value={header.concept} onChange={e => setHeader({ ...header, concept: e.target.value })} className="rounded border px-2 py-1" /><select value={format} onChange={e => setFormat(e.target.value as PaperFormat)} className="rounded border px-2 py-1"><option value="a3">A3 quer</option><option value="a4">A4 quer</option></select></div><MoodboardPreview page={pages[0]} header={header} pageNumber={1} /><div className="mt-4 flex gap-2"><button onClick={() => setPages([])} className="rounded border px-3 py-2">Pflanzen ändern</button><button onClick={exportPdf} className="rounded bg-emerald-700 px-3 py-2 font-semibold text-white">PDF exportieren</button></div></>}</div></div></div>;
}
