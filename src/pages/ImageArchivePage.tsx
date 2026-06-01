import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, FolderSearch, Image, X, Tag, CheckCircle, AlertCircle } from 'lucide-react';
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

const FOLDER_PATH = '/Test_Enea Group Objects/Test Metadata';

// Bidirectional synonym map: each entry lists all equivalent terms (DE + EN)
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
    if (group.some((s) => s === normalized)) {
      return group;
    }
  }
  return [normalized];
}

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
    <div className="bg-gray-100 h-52 w-full" />
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-5 w-16 bg-gray-100 rounded-full" />
        ))}
      </div>
      <div className="h-3 w-3/4 bg-gray-100 rounded" />
    </div>
  </div>
);

const ImageCard: React.FC<{ image: DropboxImage }> = ({ image }) => {
  const [imgError, setImgError] = useState(false);
  const fileName = image.dropbox_path.split('/').pop() ?? image.dropbox_path;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-cyan-400 hover:shadow-md transition-all duration-200 group">
      <div className="relative h-52 bg-gray-50 overflow-hidden">
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
      </div>
      <div className="p-4">
        {image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {image.tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
            {image.tags.length > 6 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">
                +{image.tags.length - 6}
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
  phase: 'idle',
  total: 0,
  processed: 0,
  skipped: 0,
  currentFile: '',
  errors: [],
  message: '',
};

export const ImageArchivePage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [images, setImages] = useState<DropboxImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [progress, setProgress] = useState<ScanProgress>(initialProgress);
  const abortRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const terms = searchQuery
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      setDebouncedQuery(terms.join(','));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const rawTerms = debouncedQuery
        ? debouncedQuery.split(',').filter(Boolean)
        : [];

      // Each term expands to a list of synonyms — we need images whose tags
      // overlap with ALL synonym groups (AND across terms, OR within each group).
      // Strategy: fetch with the first term's synonyms via .overlaps(), then
      // filter client-side for all remaining terms. For small result sets this
      // is fine; for large archives a DB function would be better.
      let query = supabase
        .from('dropbox_images_index')
        .select('*', { count: 'exact' })
        .order('last_scanned_at', { ascending: false })
        .limit(200);

      if (rawTerms.length > 0) {
        const firstExpanded = expandSearchTerms(rawTerms[0]);
        query = query.overlaps('tags', firstExpanded);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      let results = data ?? [];

      // Client-side AND-filter for remaining terms
      if (rawTerms.length > 1) {
        for (let i = 1; i < rawTerms.length; i++) {
          const expanded = expandSearchTerms(rawTerms[i]);
          results = results.filter((img) =>
            img.tags.some((tag: string) => expanded.includes(tag.toLowerCase()))
          );
        }
      }

      setImages(results);
      setTotalCount(rawTerms.length > 0 ? results.length : (count ?? 0));
    } catch (err) {
      console.error('Failed to fetch images:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleScan = async () => {
    abortRef.current = false;
    setProgress({ ...initialProgress, phase: 'listing', message: 'Dateiliste wird abgerufen...' });

    try {
      // Step 1: list all file paths — no images downloaded server-side
      const { data: listData, error: listError } = await supabase.functions.invoke<{
        success: boolean;
        paths: string[];
        totalFound: number;
        skippedCount: number;
      }>('scan-dropbox-folder', {
        body: { action: 'list_files', folderPath: FOLDER_PATH },
      });

      if (listError) throw listError;
      if (!listData?.paths) throw new Error('Keine Dateipfade erhalten.');

      const paths = listData.paths;
      const skippedAlready = listData.skippedCount ?? 0;

      if (paths.length === 0) {
        setProgress((p) => ({
          ...p,
          phase: 'done',
          message: `Alle ${listData.totalFound} Bilder bereits verarbeitet — nichts zu tun.`,
        }));
        return;
      }

      setProgress((p) => ({
        ...p,
        phase: 'processing',
        total: paths.length,
        message: `${paths.length} neue Bilder gefunden${skippedAlready > 0 ? `, ${skippedAlready} bereits getaggt übersprungen` : ''}. Starte Verarbeitung...`,
      }));

      let processed = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Step 2: process each image sequentially from the frontend
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
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${fileName}: ${msg}`);
          skipped++;
        }

        setProgress((p) => ({
          ...p,
          processed: processed,
          skipped: skipped,
          errors,
          message: abortRef.current
            ? 'Scan abgebrochen.'
            : `Verarbeite Bild ${processed + skipped} von ${paths.length}...`,
        }));
      }

      setProgress((p) => ({
        ...p,
        phase: abortRef.current ? 'error' : 'done',
        currentFile: '',
        message: abortRef.current
          ? `Scan abgebrochen. ${processed} von ${paths.length} verarbeitet.`
          : `Scan abgeschlossen: ${processed} verarbeitet, ${skipped} übersprungen.`,
      }));

      if (!abortRef.current) await fetchImages();
    } catch (err) {
      setProgress((p) => ({
        ...p,
        phase: 'error',
        currentFile: '',
        message: err instanceof Error ? err.message : 'Scan fehlgeschlagen.',
      }));
    }
  };

  const handleAbort = () => {
    abortRef.current = true;
  };

  const isScanning = progress.phase === 'listing' || progress.phase === 'processing';
  const progressPercent =
    progress.total > 0
      ? Math.round(((progress.processed + progress.skipped) / progress.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
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

        {/* Admin Control Panel */}
        {isAdmin && (
          <div className="bg-white border border-cyan-200 rounded-xl p-5 mb-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-semibold text-cyan-700 uppercase tracking-wide mb-0.5">Admin Control Panel</p>
                <p className="text-sm text-gray-500">
                  Starte einen neuen KI-Scan für{' '}
                  <span className="font-mono text-gray-700">{FOLDER_PATH}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isScanning && (
                  <button
                    onClick={handleAbort}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Abbrechen
                  </button>
                )}
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Scan läuft...' : 'Neuen Dropbox-Scan starten'}
                </button>
              </div>
            </div>

            {/* Progress display */}
            {progress.phase !== 'idle' && (
              <div className="space-y-3">
                {/* Status row */}
                <div className="flex items-center gap-2 text-sm">
                  {progress.phase === 'done' && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                  {progress.phase === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  {isScanning && (
                    <span className="inline-block w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                  <span className={
                    progress.phase === 'done' ? 'text-green-700 font-medium' :
                    progress.phase === 'error' ? 'text-red-700 font-medium' :
                    'text-gray-700'
                  }>
                    {progress.message}
                  </span>
                </div>

                {/* Progress bar */}
                {progress.total > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {progress.processed} verarbeitet · {progress.skipped} übersprungen
                      </span>
                      <span className="font-medium text-gray-700">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progress.phase === 'done' ? 'bg-green-500' :
                          progress.phase === 'error' ? 'bg-red-400' :
                          'bg-cyan-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {progress.currentFile && (
                      <p className="text-xs text-gray-400 truncate font-mono">
                        {progress.currentFile}
                      </p>
                    )}
                  </div>
                )}

                {/* Errors */}
                {progress.errors.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-red-600 font-medium hover:underline">
                      {progress.errors.length} Fehler anzeigen
                    </summary>
                    <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pl-3 border-l-2 border-red-200">
                      {progress.errors.map((e, i) => (
                        <li key={i} className="text-red-700 font-mono">{e}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Tags (kommagetrennt): grün, stone, modern..."
            className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-sm transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
            <Tag className="w-4 h-4" />
            {debouncedQuery ? (
              <span>
                <span className="font-medium text-gray-700">{images.length}</span> Ergebnis{images.length !== 1 ? 'se' : ''} für{' '}
                {debouncedQuery.split(',').map((t, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-gray-400"> + </span>}
                    <span className="font-medium text-gray-700">&ldquo;{t}&rdquo;</span>
                  </span>
                ))}
              </span>
            ) : (
              <span>
                <span className="font-medium text-gray-700">{totalCount}</span> Bilder im Archiv
              </span>
            )}
          </div>
        )}

        {/* Image Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FolderSearch className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Keine Bilder gefunden</h3>
            <p className="text-gray-500 max-w-sm">
              {debouncedQuery
                ? `Für den Begriff "${debouncedQuery}" wurden keine Einträge gefunden. Versuche ein anderes Schlagwort.`
                : 'Das Archiv ist noch leer. Ein Admin kann einen Scan starten, um Bilder zu importieren.'}
            </p>
            {debouncedQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-5 px-4 py-2 text-sm text-cyan-600 border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors"
              >
                Suche zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image) => (
              <ImageCard key={image.id} image={image} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
