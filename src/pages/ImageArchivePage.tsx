import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, FolderSearch, Image, X, Tag, CheckCircle, AlertCircle, Download, CheckSquare, Square, ChevronLeft, ChevronRight, Loader2, Bone as ZipIcon } from 'lucide-react';
import JSZip from 'jszip';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DropboxImage {
  id: string;
  dropbox_path: string;
  dropbox_shared_link: string | null;
  tags: string[];
  last_scanned_at: string;
  status: string;
}

const PAGE_SIZE = 50;
const FOLDER_PATH = '/Test_Enea Group Objects/Test Metadata';

const TAG_SYNONYMS: string[][] = [
  ['grün', 'green', 'grüner', 'grüne'],
  ['blau', 'blue', 'blaue', 'blauer'],
  ['rot', 'red', 'rote', 'roter'],
  ['gelb', 'yellow', 'gelbe', 'gelber'],
  ['weiß', 'weiss', 'white', 'weiße'],
  ['schwarz', 'black', 'schwarze', 'schwarzer'],
  ['grau', 'grey', 'gray', 'graue', 'grauer'],
  ['braun', 'brown', 'braune', 'brauner'],
  ['orange', 'orangefarbig'],
  ['pink', 'rosa', 'pink', 'rose'],
  ['lila', 'purple', 'violet', 'violett'],
  ['beige', 'creme', 'cream'],
  ['baum', 'tree', 'bäume', 'trees'],
  ['pflanze', 'plant', 'pflanzen', 'plants'],
  ['blume', 'flower', 'blumen', 'flowers'],
  ['gras', 'grass', 'rasen', 'lawn'],
  ['strauch', 'shrub', 'sträucher', 'shrubs', 'busch', 'bush'],
  ['stein', 'stone', 'steine', 'stones', 'fels', 'rock'],
  ['holz', 'wood', 'wooden'],
  ['wasser', 'water'],
  ['licht', 'light', 'hell', 'bright'],
  ['dunkel', 'dark', 'düster'],
  ['modern', 'zeitgemäß', 'contemporary'],
  ['natürlich', 'natural', 'natur', 'nature'],
  ['minimalistisch', 'minimalist', 'minimal'],
  ['tropisch', 'tropical'],
  ['mediterran', 'mediterranean'],
  ['frühling', 'spring'],
  ['sommer', 'summer'],
  ['herbst', 'autumn', 'fall'],
  ['winter'],
  ['textur', 'texture', 'texturiert', 'textured'],
  ['garten', 'garden'],
  ['stadtgarten', 'urban garden', 'urban'],
  ['terrasse', 'terrace', 'patio'],
  ['weg', 'path', 'pfad', 'walkway'],
];

function expandSearchTerms(term: string): string[] {
  const normalized = term.toLowerCase().trim();
  for (const group of TAG_SYNONYMS) {
    if (group.some((s) => s === normalized)) return group;
  }
  return [normalized];
}

// ── Download helpers ──────────────────────────────────────────────────────────

const proxyUrl = (imageUrl: string): string => {
  const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image-download`;
  return `${base}?url=${encodeURIComponent(imageUrl)}`;
};

const fetchImageBlob = async (url: string): Promise<Blob> => {
  const res = await fetch(proxyUrl(url), {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
};

const downloadSingle = async (image: DropboxImage): Promise<void> => {
  if (!image.dropbox_shared_link) return;
  const blob = await fetchImageBlob(image.dropbox_shared_link);
  const fileName = image.dropbox_path.split('/').pop() ?? 'image';
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
};

const downloadZip = async (
  images: DropboxImage[],
  onProgress: (n: number, total: number) => void
): Promise<void> => {
  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    onProgress(i, images.length);
    if (!img.dropbox_shared_link) continue;
    try {
      const blob = await fetchImageBlob(img.dropbox_shared_link);
      let baseName = img.dropbox_path.split('/').pop() ?? `image_${i}`;
      const count = usedNames.get(baseName) ?? 0;
      usedNames.set(baseName, count + 1);
      if (count > 0) {
        const ext = baseName.includes('.') ? '.' + baseName.split('.').pop() : '';
        const stem = baseName.slice(0, baseName.length - ext.length);
        baseName = `${stem}_${count}${ext}`;
      }
      zip.file(baseName, blob);
    } catch { /* skip failed */ }
  }

  onProgress(images.length, images.length);
  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const objectUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `enea_images_${new Date().toISOString().split('T')[0]}.zip`;
  a.click();
  URL.revokeObjectURL(objectUrl);
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
    <div className="bg-gray-100 h-48 w-full" />
    <div className="p-3 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3].map((i) => <div key={i} className="h-4 w-14 bg-gray-100 rounded-full" />)}
      </div>
      <div className="h-3 w-3/4 bg-gray-100 rounded" />
    </div>
  </div>
);

interface ImageCardProps {
  image: DropboxImage;
  selected: boolean;
  onToggle: () => void;
  onDownload: () => void;
  downloading: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, selected, onToggle, onDownload, downloading }) => {
  const [imgError, setImgError] = useState(false);
  const fileName = image.dropbox_path.split('/').pop() ?? image.dropbox_path;

  return (
    <div
      className={`bg-white rounded-xl border-2 overflow-hidden transition-all duration-200 group cursor-pointer
        ${selected ? 'border-cyan-500 shadow-md shadow-cyan-100' : 'border-gray-200 hover:border-cyan-300 hover:shadow-sm'}`}
      onClick={onToggle}
    >
      {/* Image area */}
      <div className="relative h-48 bg-gray-50 overflow-hidden">
        {image.dropbox_shared_link && !imgError ? (
          <img
            src={image.dropbox_shared_link}
            alt={fileName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            <Image className="w-10 h-10" />
            <span className="text-xs text-gray-400">Vorschau nicht verfügbar</span>
          </div>
        )}

        {/* Selection checkbox overlay */}
        <div className={`absolute top-2 left-2 transition-opacity duration-150
          ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shadow-sm
            ${selected ? 'bg-cyan-500' : 'bg-white/90 border border-gray-300'}`}>
            {selected && <CheckCircle className="w-4 h-4 text-white" />}
          </div>
        </div>

        {/* Download single button */}
        {image.dropbox_shared_link && (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            disabled={downloading}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-lg shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 disabled:opacity-50"
            title="Download"
          >
            {downloading
              ? <Loader2 className="w-3.5 h-3.5 text-gray-600 animate-spin" />
              : <Download className="w-3.5 h-3.5 text-gray-600" />}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {image.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {tag}
              </span>
            ))}
            {image.tags.length > 5 && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">
                +{image.tags.length - 5}
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400 truncate font-mono" title={image.dropbox_path}>
          {fileName}
        </p>
      </div>
    </div>
  );
};

// ── Scan progress types ───────────────────────────────────────────────────────

interface ScanProgress {
  phase: 'idle' | 'listing' | 'processing' | 'done' | 'error';
  total: number;
  processed: number;
  skipped: number;
  currentFile: string;
  errors: string[];
  message: string;
}

const initialProgress: ScanProgress = {
  phase: 'idle', total: 0, processed: 0, skipped: 0, currentFile: '', errors: [], message: '',
};

// ── Page component ─────────────────────────────────────────────────────────────

export const ImageArchivePage: React.FC = () => {
  const { isAdmin } = useAuth();

  // Search & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Data
  const [images, setImages] = useState<DropboxImage[]>([]);
  const [allMatchingImages, setAllMatchingImages] = useState<DropboxImage[]>([]); // all results for current query
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Downloads
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ n: number; total: number } | null>(null);

  // Scan (admin)
  const [progress, setProgress] = useState<ScanProgress>(initialProgress);
  const abortRef = useRef(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const terms = searchQuery.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      setDebouncedQuery(terms.join(','));
      setCurrentPage(1);
      setSelectedIds(new Set());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const rawTerms = debouncedQuery ? debouncedQuery.split(',').filter(Boolean) : [];

      let query = supabase
        .from('dropbox_images_index')
        .select('*', { count: 'exact' })
        .order('last_scanned_at', { ascending: false });

      if (rawTerms.length > 0) {
        const firstExpanded = expandSearchTerms(rawTerms[0]);
        query = (query as any).overlaps('tags', firstExpanded);
      }

      // Fetch enough for all pages — for large archives we fetch the page range only.
      // For filtered queries we over-fetch to enable client-side AND filtering.
      const fetchLimit = rawTerms.length > 1 ? 2000 : 5000;
      const { data, error, count } = await (query as any).limit(fetchLimit);
      if (error) throw error;

      let results: DropboxImage[] = data ?? [];

      if (rawTerms.length > 1) {
        for (let i = 1; i < rawTerms.length; i++) {
          const expanded = expandSearchTerms(rawTerms[i]);
          results = results.filter((img) =>
            img.tags.some((tag: string) => expanded.includes(tag.toLowerCase()))
          );
        }
      }

      setAllMatchingImages(results);
      setTotalCount(rawTerms.length > 0 ? results.length : (count ?? results.length));
    } catch (err) {
      console.error('Failed to fetch images:', err);
      setAllMatchingImages([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  // Slice to current page
  useEffect(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    setImages(allMatchingImages.slice(start, start + PAGE_SIZE));
  }, [allMatchingImages, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageIds = images.map((img) => img.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  // ── Selection handlers ──────────────────────────────────────────────────────

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) { pageIds.forEach((id) => next.delete(id)); }
      else { pageIds.forEach((id) => next.add(id)); }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Download handlers ───────────────────────────────────────────────────────

  const handleDownloadSingle = async (image: DropboxImage) => {
    setDownloadingId(image.id);
    try { await downloadSingle(image); }
    catch { alert('Download fehlgeschlagen.'); }
    finally { setDownloadingId(null); }
  };

  const handleDownloadZip = async () => {
    const toDownload = allMatchingImages.filter((img) => selectedIds.has(img.id));
    if (toDownload.length === 0) return;
    setZipping(true);
    setZipProgress({ n: 0, total: toDownload.length });
    try {
      await downloadZip(toDownload, (n, total) => setZipProgress({ n, total }));
    } catch {
      alert('ZIP-Download fehlgeschlagen.');
    } finally {
      setZipping(false);
      setZipProgress(null);
    }
  };

  // ── Import Dropbox tags ─────────────────────────────────────────────────────

  const handleImportDropboxTags = async () => {
    abortRef.current = false;
    setProgress({ ...initialProgress, phase: 'listing', message: 'Dateiliste wird abgerufen...' });
    try {
      // Step 1: list all paths
      const { data: listData, error: listError } = await supabase.functions.invoke<{
        success: boolean; paths: string[]; total: number;
      }>('scan-dropbox-folder', { body: { action: 'list_files_for_tag_import', folderPath: FOLDER_PATH } });

      if (listError) throw new Error(listError.message);
      if (!listData?.paths) throw new Error('Keine Dateipfade erhalten.');

      const paths = listData.paths;
      setProgress((p) => ({
        ...p,
        phase: 'processing',
        total: paths.length,
        message: `${paths.length} Dateien gefunden. Lese Tags aus...`,
      }));

      let imported = 0, noTags = 0, skipped = 0;
      const errors: string[] = [];

      // Step 2: process each file individually for live progress
      for (const imagePath of paths) {
        if (abortRef.current) break;
        const fileName = imagePath.split('/').pop() ?? imagePath;
        setProgress((p) => ({ ...p, currentFile: fileName }));

        try {
          const { data: fileData, error: fileError } = await supabase.functions.invoke<{
            success: boolean; noTags: boolean; tagCount?: number;
          }>('scan-dropbox-folder', { body: { action: 'import_single_file_tags', imagePath } });

          if (fileError) throw new Error(fileError.message);
          if (fileData?.noTags) noTags++;
          else imported++;
        } catch (err) {
          errors.push(`${fileName}: ${err instanceof Error ? err.message : String(err)}`);
          skipped++;
        }

        setProgress((p) => ({
          ...p,
          processed: imported + noTags,
          skipped,
          errors,
          message: `Verarbeite ${imported + noTags + skipped} von ${paths.length}...`,
        }));
      }

      setProgress((p) => ({
        ...p,
        phase: abortRef.current ? 'error' : 'done',
        currentFile: '',
        message: abortRef.current
          ? `Abgebrochen. ${imported} importiert.`
          : `Fertig: ${imported} mit Tags importiert, ${noTags} ohne Tags, ${skipped} Fehler.`,
      }));

      if (!abortRef.current) await fetchImages();
    } catch (err) {
      setProgress((p) => ({
        ...p, phase: 'error', currentFile: '',
        message: err instanceof Error ? err.message : 'Import fehlgeschlagen.',
      }));
    }
  };

  // ── AI Scan ────────────────────────────────────────────────────────────────────

  const handleScan = async () => {
    abortRef.current = false;
    setProgress({ ...initialProgress, phase: 'listing', message: 'Dateiliste wird abgerufen...' });
    try {
      const { data: listData, error: listError } = await supabase.functions.invoke<{
        success: boolean; paths: string[]; totalFound: number; skippedCount: number;
      }>('scan-dropbox-folder', { body: { action: 'list_files', folderPath: FOLDER_PATH } });

      if (listError) throw listError;
      if (!listData?.paths) throw new Error('Keine Dateipfade erhalten.');

      const paths = listData.paths;
      const skippedAlready = listData.skippedCount ?? 0;

      if (paths.length === 0) {
        setProgress((p) => ({ ...p, phase: 'done', message: `Alle ${listData.totalFound} Bilder bereits verarbeitet.` }));
        return;
      }

      setProgress((p) => ({
        ...p, phase: 'processing', total: paths.length,
        message: `${paths.length} neue Bilder${skippedAlready > 0 ? `, ${skippedAlready} übersprungen` : ''}. Starte...`,
      }));

      let processed = 0, skipped = 0;
      const errors: string[] = [];

      for (const imagePath of paths) {
        if (abortRef.current) break;
        const fileName = imagePath.split('/').pop() ?? imagePath;
        setProgress((p) => ({ ...p, currentFile: fileName }));
        try {
          const { error: procError } = await supabase.functions.invoke('scan-dropbox-folder', {
            body: { action: 'process_single_image', imagePath },
          });
          if (procError) throw procError;
          processed++;
        } catch (err) {
          errors.push(`${fileName}: ${err instanceof Error ? err.message : String(err)}`);
          skipped++;
        }
        setProgress((p) => ({ ...p, processed, skipped, errors, message: `Bild ${processed + skipped} von ${paths.length}...` }));
      }

      setProgress((p) => ({
        ...p, phase: abortRef.current ? 'error' : 'done', currentFile: '',
        message: abortRef.current
          ? `Abgebrochen. ${processed} von ${paths.length} verarbeitet.`
          : `Abgeschlossen: ${processed} verarbeitet, ${skipped} übersprungen.`,
      }));

      if (!abortRef.current) await fetchImages();
    } catch (err) {
      setProgress((p) => ({ ...p, phase: 'error', currentFile: '', message: err instanceof Error ? err.message : 'Scan fehlgeschlagen.' }));
    }
  };

  const handleAbort = () => { abortRef.current = true; };
  const isScanning = progress.phase === 'listing' || progress.phase === 'processing';
  const progressPercent = progress.total > 0 ? Math.round(((progress.processed + progress.skipped) / progress.total) * 100) : 0;

  const selectedCount = selectedIds.size;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-cyan-500/10 rounded-lg">
              <FolderSearch className="w-5 h-5 text-cyan-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Image Search</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Durchsuche unsere Dropbox-Projektdatenbank nach Pflanzen, Materialien und Stimmungen — analysiert und verschlagwortet durch KI.
          </p>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="bg-white border border-cyan-200 rounded-xl p-5 mb-8 shadow-sm space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-semibold text-cyan-700 uppercase tracking-wide mb-0.5">Admin Control Panel</p>
                <p className="text-sm text-gray-500">
                  Ordner: <span className="font-mono text-gray-700">{FOLDER_PATH}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isScanning && (
                  <button onClick={handleAbort} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors">
                    <X className="w-4 h-4" /> Abbrechen
                  </button>
                )}
                {/* Primary: read existing Dropbox tags — fast, no AI */}
                <button
                  onClick={handleImportDropboxTags}
                  disabled={isScanning}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Dropbox-Tags importieren
                </button>
                {/* Secondary: AI scan for untagged images */}
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 disabled:bg-gray-50 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Scan läuft...' : 'KI-Scan (ungetaggte Bilder)'}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Wenn Bilder in Dropbox bereits mit Tags versehen sind, nutze <strong className="text-gray-500">Dropbox-Tags importieren</strong> — das liest die bestehenden Tags direkt aus ohne KI. Der KI-Scan ist nur für Bilder ohne Tags nötig.
            </p>

            {progress.phase !== 'idle' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  {progress.phase === 'done' && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                  {progress.phase === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  {isScanning && <span className="inline-block w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin shrink-0" />}
                  <span className={progress.phase === 'done' ? 'text-green-700 font-medium' : progress.phase === 'error' ? 'text-red-700 font-medium' : 'text-gray-700'}>
                    {progress.message}
                  </span>
                </div>
                {progress.total > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{progress.processed} verarbeitet · {progress.skipped} übersprungen</span>
                      <span className="font-medium text-gray-700">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${progress.phase === 'done' ? 'bg-green-500' : progress.phase === 'error' ? 'bg-red-400' : 'bg-cyan-500'}`} style={{ width: `${progressPercent}%` }} />
                    </div>
                    {progress.currentFile && <p className="text-xs text-gray-400 truncate font-mono">{progress.currentFile}</p>}
                  </div>
                )}
                {progress.errors.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-red-600 font-medium hover:underline">{progress.errors.length} Fehler anzeigen</summary>
                    <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pl-3 border-l-2 border-red-200">
                      {progress.errors.map((e, i) => <li key={i} className="text-red-700 font-mono">{e}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Tags (kommagetrennt): grün, stone, modern..."
            className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-sm transition"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toolbar: count + select-all + download strip */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          {/* Left: count */}
          {!loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Tag className="w-4 h-4" />
              {debouncedQuery ? (
                <span>
                  <span className="font-semibold text-gray-700">{totalCount}</span> Ergebnis{totalCount !== 1 ? 'se' : ''}
                </span>
              ) : (
                <span>
                  <span className="font-semibold text-gray-700">{totalCount}</span> Bilder im Archiv
                </span>
              )}
              {totalPages > 1 && (
                <span className="text-gray-400">— Seite {currentPage} / {totalPages}</span>
              )}
            </div>
          )}

          {/* Right: select all + download buttons */}
          {!loading && images.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Select page toggle */}
              <button
                onClick={togglePage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
              >
                {allPageSelected
                  ? <CheckSquare className="w-4 h-4 text-cyan-600" />
                  : <Square className="w-4 h-4" />}
                {allPageSelected ? 'Seite abwählen' : 'Seite auswählen'}
              </button>

              {selectedCount > 0 && (
                <>
                  <span className="text-sm font-medium text-cyan-700 bg-cyan-50 px-2.5 py-1.5 rounded-lg border border-cyan-200">
                    {selectedCount} ausgewählt
                  </span>
                  <button
                    onClick={handleDownloadZip}
                    disabled={zipping}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors disabled:opacity-60"
                  >
                    {zipping
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <ZipIcon className="w-4 h-4" />}
                    {zipping && zipProgress
                      ? `${zipProgress.n} / ${zipProgress.total}`
                      : 'Als ZIP herunterladen'}
                  </button>
                  <button
                    onClick={clearSelection}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-colors"
                    title="Auswahl aufheben"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FolderSearch className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Keine Bilder gefunden</h3>
            <p className="text-gray-500 max-w-sm">
              {debouncedQuery
                ? `Für den Begriff "${debouncedQuery}" wurden keine Einträge gefunden.`
                : 'Das Archiv ist noch leer. Ein Admin kann einen Scan starten.'}
            </p>
            {debouncedQuery && (
              <button onClick={() => setSearchQuery('')} className="mt-5 px-4 py-2 text-sm text-cyan-600 border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors">
                Suche zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                selected={selectedIds.has(image.id)}
                onToggle={() => toggleOne(image.id)}
                onDownload={() => handleDownloadSingle(image)}
                downloading={downloadingId === image.id}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page number pills */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | '…')[]>((acc, p, i, arr) => {
                if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                      ${currentPage === p ? 'bg-cyan-600 text-white' : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-600'}`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
