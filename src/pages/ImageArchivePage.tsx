import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, FolderSearch, Image, X, Tag } from 'lucide-react';
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

interface ScanResult {
  success: boolean;
  total: number;
  processed: number;
  skipped: number;
  errors?: string[];
}

const FOLDER_PATH = '/Enea_Bilder';

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

export const ImageArchivePage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [images, setImages] = useState<DropboxImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('dropbox_images_index')
        .select('*', { count: 'exact' })
        .order('last_scanned_at', { ascending: false })
        .limit(60);

      if (debouncedQuery) {
        query = query.contains('tags', [debouncedQuery]);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setImages(data ?? []);
      setTotalCount(count ?? 0);
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
    setScanning(true);
    setScanResult(null);
    try {
      const { data, error } = await supabase.functions.invoke<ScanResult>('scan-dropbox-folder', {
        body: { folderPath: FOLDER_PATH },
      });
      if (error) throw error;
      if (data?.success) {
        setScanResult({
          type: 'success',
          message: `Scan abgeschlossen: ${data.processed} von ${data.total} Bildern verarbeitet.`,
        });
        await fetchImages();
      }
    } catch (err) {
      setScanResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Scan fehlgeschlagen.',
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-cyan-500/10 rounded-lg">
              <FolderSearch className="w-5 h-5 text-cyan-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">KI Bild-Archiv</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Durchsuche unsere Dropbox-Projektdatenbank nach Pflanzen, Materialien und Stimmungen — analysiert und verschlagwortet durch KI.
          </p>
        </div>

        {/* Admin Control Panel */}
        {isAdmin && (
          <div className="bg-white border border-cyan-200 rounded-xl p-5 mb-8 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-semibold text-cyan-700 uppercase tracking-wide mb-0.5">Admin Control Panel</p>
                <p className="text-sm text-gray-500">
                  Starte einen neuen KI-Scan für den Ordner <span className="font-mono text-gray-700">{FOLDER_PATH}</span>
                </p>
              </div>
              <button
                onClick={handleScan}
                disabled={scanning}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Scan läuft...' : 'Neuen Dropbox-Scan starten'}
              </button>
            </div>

            {scanResult && (
              <div className={`mt-4 flex items-start justify-between gap-3 px-4 py-3 rounded-lg text-sm ${
                scanResult.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <span>{scanResult.message}</span>
                <button onClick={() => setScanResult(null)} className="shrink-0 opacity-60 hover:opacity-100">
                  <X className="w-4 h-4" />
                </button>
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
            placeholder="Suche nach Schlagwörtern: Pflanze, Material, Farbe, Stimmung..."
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
                <span className="font-medium text-gray-700">{images.length}</span> Ergebnis{images.length !== 1 ? 'se' : ''} für &ldquo;{debouncedQuery}&rdquo;
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
