import React, { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Search, Loader, AlertTriangle, ImageIcon, Link2, Trash2,
  Copy, ExternalLink, RefreshCw, CheckCircle, XCircle,
} from 'lucide-react';

interface ImageRecord {
  id: string;
  plant_id: number;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface PlantRecord {
  id: number;
  botanical_name: string;
  common_name_de?: string;
  common_name_en?: string;
  image_url?: string;
}

interface BrokenLink {
  record: ImageRecord;
  plant: PlantRecord | undefined;
}

interface SharedImage {
  url: string;
  plants: Array<{ plant_id: number; botanical_name: string; record_id: string; is_primary: boolean }>;
}

interface PlantNoImages {
  plant: PlantRecord;
}

interface OrphanedFile {
  fileName: string;
}

interface ScanResults {
  brokenLinks: BrokenLink[];
  sharedImages: SharedImage[];
  plantsNoImages: PlantNoImages[];
  orphanedFiles: OrphanedFile[];
  totalPlants: number;
  totalImageRecords: number;
  totalStorageFiles: number;
}

type FixState = 'idle' | 'fixing' | 'done' | 'error';

export const ImageDiagnostics: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [fixState, setFixState] = useState<FixState>('idle');
  const [fixMessage, setFixMessage] = useState<string>('');

  const fileNameFromUrl = (url: string): string => {
    try {
      return decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    } catch {
      return '';
    }
  };

  const listAllStorageFiles = async (): Promise<string[]> => {
    const files: string[] = [];
    const pageSize = 1000;
    let offset = 0;

    while (true) {
      const { data, error } = await supabase.storage.from('plant-images').list('', {
        limit: pageSize,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) throw error;

      const pageFiles = (data || []).filter(file => file.id).map(file => file.name);
      files.push(...pageFiles);

      if (!data || data.length < pageSize) break;
      offset += pageSize;
    }

    return files;
  };

  const urlIsAvailable = async (url: string): Promise<boolean> => {
    try {
      const headResponse = await fetch(url, { method: 'HEAD' });
      if (headResponse.ok) return true;

      const getResponse = await fetch(url, { method: 'GET' });
      return getResponse.ok;
    } catch {
      return false;
    }
  };

  const runScan = useCallback(async () => {
    setScanning(true);
    setScanError(null);
    setFixState('idle');
    setFixMessage('');

    try {
      const [plantsRes, imageRecordsRes, storageFiles] = await Promise.all([
        supabase.from('plants_flat').select('id, botanical_name, common_name_de, common_name_en, image_url'),
        supabase.from('plant_images').select('id, plant_id, image_url, display_order, is_primary'),
        listAllStorageFiles(),
      ]);

      if (plantsRes.error) throw plantsRes.error;
      if (imageRecordsRes.error) throw imageRecordsRes.error;

      const plants: PlantRecord[] = plantsRes.data || [];
      const imageRecords: ImageRecord[] = imageRecordsRes.data || [];

      const plantMap = new Map<number, PlantRecord>();
      for (const p of plants) {
        plantMap.set(p.id, p);
      }

      // 1. Broken links: verify the public image URL directly so valid files are not
      // reported as broken because of storage-list pagination or filename differences.
      const availability = await Promise.all(
        imageRecords.map(async record => ({
          record,
          available: await urlIsAvailable(record.image_url),
        }))
      );
      const brokenLinks: BrokenLink[] = availability
        .filter(item => !item.available)
        .map(item => ({
          record: item.record,
          plant: plantMap.get(item.record.plant_id),
        }));

      // 2. Shared images: same URL used by multiple plants
      const urlToRecords = new Map<string, ImageRecord[]>();
      for (const record of imageRecords) {
        const existing = urlToRecords.get(record.image_url);
        if (existing) {
          existing.push(record);
        } else {
          urlToRecords.set(record.image_url, [record]);
        }
      }

      const sharedImages: SharedImage[] = [];
      for (const [url, records] of urlToRecords) {
        const uniquePlantIds = new Set(records.map(r => r.plant_id));
        if (uniquePlantIds.size > 1) {
          sharedImages.push({
            url,
            plants: records.map(r => ({
              plant_id: r.plant_id,
              botanical_name: plantMap.get(r.plant_id)?.botanical_name || `ID ${r.plant_id}`,
              record_id: r.id,
              is_primary: r.is_primary,
            })),
          });
        }
      }

      // 3. Plants with no images at all
      const plantIdsWithImages = new Set(imageRecords.map(r => r.plant_id));
      const plantsNoImages: PlantNoImages[] = plants
        .filter(p => !plantIdsWithImages.has(p.id))
        .map(p => ({ plant: p }));

      // 4. Orphaned files in storage: files not referenced by any image record
      const referencedFileNames = new Set(imageRecords.map(r => fileNameFromUrl(r.image_url)));
      const orphanedFiles: OrphanedFile[] = storageFiles
        .filter(name => !referencedFileNames.has(name))
        .map(name => ({ fileName: name }));

      setResults({
        brokenLinks,
        sharedImages,
        plantsNoImages,
        orphanedFiles,
        totalPlants: plants.length,
        totalImageRecords: imageRecords.length,
        totalStorageFiles: storageFiles.length,
      });
    } catch (err) {
      console.error('Scan failed:', err);
      setScanError(err instanceof Error ? err.message : 'Scan failed unexpectedly');
    } finally {
      setScanning(false);
    }
  }, []);

  const removeBrokenLinks = async () => {
    if (!results || results.brokenLinks.length === 0) return;
    if (!confirm(`Remove ${results.brokenLinks.length} broken image link(s)? This only deletes the dead database entries, not any actual files.`)) return;

    setFixState('fixing');
    setFixMessage('');
    try {
      const ids = results.brokenLinks.map(b => b.record.id);
      let deleted = 0;
      // Delete in batches of 100 (Supabase filter limit)
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const { error } = await supabase.from('plant_images').delete().in('id', batch);
        if (error) throw error;
        deleted += batch.length;
      }

      // Also clear plants_flat.image_url if it pointed to a broken link
      for (const broken of results.brokenLinks) {
        if (broken.plant && broken.plant.image_url === broken.record.image_url) {
          await supabase.from('plants_flat').update({ image_url: null }).eq('id', broken.plant.id);
        }
      }

      setFixState('done');
      setFixMessage(`Removed ${deleted} broken link(s).`);
      await runScan();
    } catch (err) {
      setFixState('error');
      setFixMessage(err instanceof Error ? err.message : 'Failed to remove broken links');
    }
  };

  const fixSharedImages = async () => {
    if (!results || results.sharedImages.length === 0) return;
    if (!confirm(`Fix ${results.sharedImages.length} shared image group(s)? Each shared file will be copied so every plant gets its own independent copy.`)) return;

    setFixState('fixing');
    setFixMessage('');
    let fixedCount = 0;
    let failedCount = 0;

    try {
      for (const group of results.sharedImages) {
        const sortedPlants = [...group.plants].sort((a, b) => a.plant_id - b.plant_id);
        const plantsToFix = sortedPlants.slice(1); // keep first plant's reference

        try {
          const response = await fetch(group.url);
          if (!response.ok) {
            failedCount += plantsToFix.length;
            continue;
          }
          const blob = await response.blob();
          const ext = group.url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';

          for (const p of plantsToFix) {
            try {
              const newFileName = `plant-${p.plant_id}-${Date.now()}-${crypto.randomUUID()}.${ext}`;
              const { error: uploadError } = await supabase.storage
                .from('plant-images')
                .upload(newFileName, blob, {
                  contentType: blob.type || 'image/jpeg',
                  cacheControl: '31536000',
                  upsert: false,
                });

              if (uploadError) throw uploadError;

              const { data: { publicUrl: newPublicUrl } } = supabase.storage
                .from('plant-images')
                .getPublicUrl(newFileName);

              const { error: updateError } = await supabase
                .from('plant_images')
                .update({ image_url: newPublicUrl })
                .eq('id', p.record_id);

              if (updateError) throw updateError;

              if (p.is_primary) {
                await supabase.from('plants_flat').update({ image_url: newPublicUrl }).eq('id', p.plant_id);
              }

              fixedCount++;
            } catch {
              failedCount++;
            }
          }
        } catch {
          failedCount += plantsToFix.length;
        }
      }

      setFixState('done');
      setFixMessage(`Copied ${fixedCount} image(s) to independent files. ${failedCount} failed.`);
      await runScan();
    } catch (err) {
      setFixState('error');
      setFixMessage(err instanceof Error ? err.message : 'Failed to fix shared images');
    }
  };

  const summaryCards = results ? [
    {
      label: 'Broken Links',
      value: results.brokenLinks.length,
      icon: Link2,
      color: 'text-red-600',
      bg: 'bg-red-50',
      ring: 'ring-red-200',
    },
    {
      label: 'Shared Images',
      value: results.sharedImages.length,
      icon: Copy,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      ring: 'ring-amber-200',
    },
    {
      label: 'Plants Without Images',
      value: results.plantsNoImages.length,
      icon: ImageIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      ring: 'ring-blue-200',
    },
    {
      label: 'Orphaned Files',
      value: results.orphanedFiles.length,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      ring: 'ring-orange-200',
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header + Scan button */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Image Diagnostics</h2>
            <p className="text-sm text-gray-600 mt-1">
              Scans all plant images to find broken links, shared files between varieties, plants with no images, and orphaned files in storage.
            </p>
          </div>
          <button
            onClick={runScan}
            disabled={scanning}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              scanning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {scanning ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {scanning ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>

        {scanError && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {results && (
          <div className="mt-4 text-xs text-gray-500">
            Scanned {results.totalPlants} plants, {results.totalImageRecords} image records, and {results.totalStorageFiles} files in storage.
          </div>
        )}
      </div>

      {/* Fix action banner */}
      {fixState !== 'idle' && fixMessage && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
          fixState === 'done'
            ? 'bg-green-50 border-green-200 text-green-700'
            : fixState === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {fixState === 'done' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {fixState === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
          {fixState === 'fixing' && <Loader className="w-4 h-4 animate-spin flex-shrink-0" />}
          <span>{fixMessage}</span>
        </div>
      )}

      {/* Summary cards */}
      {results && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`rounded-xl border p-5 ring-1 ${card.ring} ${card.bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-lg bg-white flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Broken Links */}
      {results && results.brokenLinks.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">Broken Image Links</h3>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                {results.brokenLinks.length}
              </span>
            </div>
            <button
              onClick={removeBrokenLinks}
              disabled={fixState === 'fixing'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove Dead Links
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Image URL</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Primary?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.brokenLinks.map((bl, i) => (
                  <tr key={i} className="hover:bg-red-50/50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {bl.plant ? (
                        <span>{bl.plant.botanical_name} <span className="text-gray-400">(ID {bl.plant.id})</span></span>
                      ) : (
                        <span className="text-red-600">Unknown plant (ID {bl.record.plant_id})</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500 truncate max-w-xs" title={bl.record.image_url}>
                      {bl.record.image_url}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {bl.record.is_primary ? (
                        <span className="text-red-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Shared Images */}
      {results && results.sharedImages.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">Shared Images Between Plants</h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {results.sharedImages.length}
              </span>
            </div>
            <button
              onClick={fixSharedImages}
              disabled={fixState === 'fixing'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:bg-gray-300 transition-colors"
            >
              {fixState === 'fixing' ? <Loader className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              Fix Shared Images
            </button>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {results.sharedImages.map((shared, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={shared.url}
                    alt="Shared"
                    className="w-12 h-12 object-cover rounded border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate" title={shared.url}>{shared.url}</p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      Shared by <span className="font-medium">{shared.plants.length}</span> plants
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 ml-15">
                  {shared.plants.map((p, j) => (
                    <span
                      key={j}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                        j === 0
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {j === 0 && <CheckCircle className="w-3 h-3" />}
                      {p.botanical_name}
                      {p.is_primary && <span className="font-semibold">(primary)</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Plants Without Images */}
      {results && results.plantsNoImages.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Plants Without Images</h3>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              {results.plantsNoImages.length}
            </span>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Botanical Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Common Name</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.plantsNoImages.slice(0, 200).map(({ plant }) => (
                  <tr key={plant.id} className="hover:bg-blue-50/50">
                    <td className="px-4 py-2 text-sm text-gray-700">{plant.id}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{plant.botanical_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {[plant.common_name_de, plant.common_name_en].filter(Boolean).join(' · ') || '-'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <a
                        href={`/admin/plant/${plant.id}?from=plants`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.plantsNoImages.length > 200 && (
              <p className="px-4 py-3 text-xs text-gray-500">
                Showing first 200 of {results.plantsNoImages.length} plants without images.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Orphaned Files */}
      {results && results.orphanedFiles.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Orphaned Files in Storage</h3>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
              {results.orphanedFiles.length}
            </span>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-3">
              These files exist in storage but no plant image record points to them. They may be leftovers from deleted images.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {results.orphanedFiles.slice(0, 200).map((file, i) => (
                <div key={i} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 truncate" title={file.fileName}>
                  {file.fileName}
                </div>
              ))}
            </div>
            {results.orphanedFiles.length > 200 && (
              <p className="mt-3 text-xs text-gray-500">
                Showing first 200 of {results.orphanedFiles.length} orphaned files.
              </p>
            )}
          </div>
        </section>
      )}

      {/* All clear state */}
      {results &&
        results.brokenLinks.length === 0 &&
        results.sharedImages.length === 0 &&
        results.plantsNoImages.length === 0 &&
        results.orphanedFiles.length === 0 && (
        <div className="bg-white rounded-lg border border-green-200 shadow-sm p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">All images are healthy</h3>
          <p className="text-sm text-gray-600 mt-1">
            No broken links, shared images, missing images, or orphaned files were found.
          </p>
        </div>
      )}

      {/* Empty state before first scan */}
      {!results && !scanning && !scanError && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">Run a scan to check image health</h3>
          <p className="text-sm text-gray-600 mt-1">
            Click "Run Scan" above to check for broken links, shared images, and missing plant pictures.
          </p>
        </div>
      )}
    </div>
  );
};
