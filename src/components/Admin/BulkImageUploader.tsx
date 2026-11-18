import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, CheckCircle, XCircle, Download, Image as ImageIcon, RefreshCw, Copy } from 'lucide-react';
import JSZip from 'jszip';

interface UploadResult {
  plantId: string;
  success: boolean;
  message: string;
  imageCount?: number;
  imageUrls?: string[];
}

export const BulkImageUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentPlantImages: 0, totalImages: 0 });

  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResults([]);
    setProgress({ current: 0, total: 0, currentPlantImages: 0, totalImages: 0 });

    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(file);

      // Get all folders (plant IDs)
      const folders = new Map<string, JSZip.JSZipObject[]>();

      zipData.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          const parts = relativePath.split('/');
          if (parts.length >= 2) {
            const plantId = parts[0];
            const fileName = parts[parts.length - 1];

            // Check if it's an image file
            if (/\.(jpg|jpeg|png|webp)$/i.test(fileName)) {
              if (!folders.has(plantId)) {
                folders.set(plantId, []);
              }
              folders.get(plantId)!.push(zipEntry);
            }
          }
        }
      });

      const plantIds = Array.from(folders.keys());
      const totalImages = Array.from(folders.values()).reduce((sum, files) => sum + Math.min(files.length, 10), 0);

      setProgress({ current: 0, total: plantIds.length, currentPlantImages: 0, totalImages });

      const uploadResults: UploadResult[] = [];

      for (let i = 0; i < plantIds.length; i++) {
        const plantId = plantIds[i];
        const imageFiles = folders.get(plantId)!;

        try {
          const uploadedUrls: string[] = [];

          // Upload up to 10 images before replacing existing records
          const maxImages = Math.min(imageFiles.length, 10);

          for (let j = 0; j < maxImages; j++) {
            const imageFile = imageFiles[j];
            const arrayBuffer = await imageFile.async('arraybuffer');

            const fileName = imageFile.name.split('/').pop()!;

            // The storage bucket accepts images up to 5MB per file.
            const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);
            if (fileSizeMB > 5) {
              throw new Error(`Image '${fileName}' is too large (${fileSizeMB.toFixed(1)}MB). Maximum size is 5MB.`);
            }

            const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
            const contentType = ext === 'png'
              ? 'image/png'
              : ext === 'webp'
                ? 'image/webp'
                : 'image/jpeg';
            const storageFileName = `${plantId}_${j + 1}_${crypto.randomUUID()}.${ext}`;
            const rawBlob = new Blob([arrayBuffer], { type: contentType });

            const { error: uploadError } = await supabase.storage
              .from('plant-images')
              .upload(storageFileName, rawBlob, {
                contentType,
                cacheControl: '31536000',
                upsert: false
              });

            if (uploadError) {
              throw new Error(`Failed to upload ${fileName}: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase.storage
              .from('plant-images')
              .getPublicUrl(storageFileName);

            uploadedUrls.push(publicUrl);

            setProgress(prev => ({ ...prev, currentPlantImages: prev.currentPlantImages + 1 }));
          }

          // Replace existing database records only after all uploads succeeded
          if (uploadedUrls.length > 0) {
            const { error: deleteError } = await supabase
              .from('plant_images')
              .delete()
              .eq('plant_id', parseInt(plantId));
            if (deleteError) throw new Error(`Failed to replace existing images: ${deleteError.message}`);

            const imageRecords = uploadedUrls.map((url, index) => ({
              plant_id: parseInt(plantId),
              image_url: url,
              display_order: index
            }));

            const { error: insertError } = await supabase
              .from('plant_images')
              .insert(imageRecords);

            if (insertError) {
              throw new Error(`Failed to insert images into database: ${insertError.message}`);
            }

            // Update the plants_flat table with the first image URL
            await supabase
              .from('plants_flat')
              .update({ image_url: uploadedUrls[0] })
              .eq('id', parseInt(plantId));

            uploadResults.push({
              plantId,
              success: true,
              message: `Uploaded ${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} successfully`,
              imageCount: uploadedUrls.length,
              imageUrls: uploadedUrls
            });
          }
        } catch (err) {
          uploadResults.push({
            plantId,
            success: false,
            message: err instanceof Error ? err.message : 'Unknown error'
          });
        }

        setProgress(prev => ({ ...prev, current: i + 1 }));
        setResults([...uploadResults]);
      }

    } catch (err) {
      console.error('Error processing zip:', err);
      alert('Error processing zip file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const syncImagesFromStorage = async () => {
    setSyncing(true);
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('plant-images')
        .list('', {
          limit: 10000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) throw listError;

      const { data: plants, error: plantsError } = await supabase
        .from('plants_flat')
        .select('id, image_url');

      if (plantsError) throw plantsError;

      const { data: imageRecords, error: imageRecordsError } = await supabase
        .from('plant_images')
        .select('id, plant_id, image_url, display_order, is_primary');

      if (imageRecordsError) throw imageRecordsError;

      const storageFiles = new Set((files || []).map(file => file.name));
      const publicUrlFor = (fileName: string): string => supabase.storage
        .from('plant-images')
        .getPublicUrl(fileName).data.publicUrl;
      const fileNameFromUrl = (url: string): string => decodeURIComponent(url.split('/').pop() || '');
      let repairedCount = 0;
      let insertedCount = 0;

      for (const record of imageRecords || []) {
        const currentFileName = fileNameFromUrl(record.image_url);
        const migratedFileName = currentFileName.replace('_migrated', '');

        if (currentFileName.includes('_migrated') && storageFiles.has(migratedFileName)) {
          const { error: repairError } = await supabase
            .from('plant_images')
            .update({ image_url: publicUrlFor(migratedFileName) })
            .eq('id', record.id);

          if (repairError) throw repairError;
          repairedCount++;
        }
      }

      for (const plant of plants || []) {
        const plantId = plant.id.toString();
        const matchingFiles = (files || []).filter(file =>
          file.name.startsWith(`${plantId}_`) || file.name.startsWith(`plant-${plantId}-`)
        );
        if (matchingFiles.length === 0) continue;

        const recordsForPlant = (imageRecords || []).filter(record => record.plant_id === plant.id);
        const existingUrls = new Set(recordsForPlant.map(record => record.image_url));
        const missingRecords = matchingFiles
          .map((file, index) => ({
            plant_id: plant.id,
            image_url: publicUrlFor(file.name),
            display_order: recordsForPlant.length + index,
            is_primary: recordsForPlant.length === 0 && index === 0
          }))
          .filter(record => !existingUrls.has(record.image_url));

        if (missingRecords.length > 0) {
          const { error: insertError } = await supabase
            .from('plant_images')
            .insert(missingRecords);
          if (insertError) throw insertError;
          insertedCount += missingRecords.length;
        }

        const currentImageFile = plant.image_url ? fileNameFromUrl(plant.image_url) : '';
        if (!plant.image_url || !storageFiles.has(currentImageFile)) {
          const { error: plantUpdateError } = await supabase
            .from('plants_flat')
            .update({ image_url: publicUrlFor(matchingFiles[0].name) })
            .eq('id', plant.id);
          if (plantUpdateError) throw plantUpdateError;
          repairedCount++;
        }
      }

      alert(`Image repair finished: ${repairedCount} links repaired and ${insertedCount} missing image records restored.`);
    } catch (err) {
      console.error('Error syncing images:', err);
      alert('Failed to repair images. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const [fixingShared, setFixingShared] = useState(false);

  const fixSharedImages = async () => {
    if (!confirm('This will detect images shared between multiple plants and give each plant its own independent copy. Continue?')) return;

    setFixingShared(true);
    try {
      const { data: imageRecords, error: imageRecordsError } = await supabase
        .from('plant_images')
        .select('id, plant_id, image_url, display_order, is_primary');

      if (imageRecordsError) throw imageRecordsError;

      const records = imageRecords || [];

      // Group by image_url to find shared files
      const urlGroups = new Map<string, typeof records>();
      for (const record of records) {
        const existing = urlGroups.get(record.image_url);
        if (existing) {
          existing.push(record);
        } else {
          urlGroups.set(record.image_url, [record]);
        }
      }

      // Find URLs shared by multiple plants
      const sharedGroups: Array<{ url: string; records: typeof records }> = [];
      for (const [url, groupRecords] of urlGroups) {
        const uniquePlantIds = new Set(groupRecords.map(r => r.plant_id));
        if (uniquePlantIds.size > 1) {
          sharedGroups.push({ url, records: groupRecords });
        }
      }

      if (sharedGroups.length === 0) {
        alert('No shared images found. All plants already have independent image files.');
        return;
      }

      let fixedCount = 0;
      let failedCount = 0;

      for (const group of sharedGroups) {
        // Keep the first plant's reference, copy the file for all other plants
        const sortedRecords = [...group.records].sort((a, b) => a.plant_id - b.plant_id);
        const recordsToFix = sortedRecords.slice(1);

        try {
          const response = await fetch(group.url);
          if (!response.ok) {
            console.error(`Cannot download shared image: ${group.url}`);
            failedCount += recordsToFix.length;
            continue;
          }
          const blob = await response.blob();
          const ext = group.url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';

          for (const record of recordsToFix) {
            try {
              const newFileName = `plant-${record.plant_id}-${Date.now()}-${crypto.randomUUID()}.${ext}`;
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
                .eq('id', record.id);

              if (updateError) throw updateError;

              // Update plants_flat image_url if this was the primary image
              if (record.is_primary) {
                await supabase
                  .from('plants_flat')
                  .update({ image_url: newPublicUrl })
                  .eq('id', record.plant_id);
              }

              fixedCount++;
            } catch (err) {
              console.error(`Failed to fix shared image for plant ${record.plant_id}:`, err);
              failedCount++;
            }
          }
        } catch (err) {
          console.error(`Failed to process shared URL ${group.url}:`, err);
          failedCount += recordsToFix.length;
        }
      }

      alert(`Shared image fix complete: ${fixedCount} images copied to independent files, ${failedCount} failed.`);
    } catch (err) {
      console.error('Error fixing shared images:', err);
      alert('Failed to fix shared images. Check console for details.');
    } finally {
      setFixingShared(false);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;
  const totalImagesUploaded = results.reduce((sum, r) => sum + (r.imageCount || 0), 0);

  const downloadLog = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPlants: results.length,
        successfulPlants: successCount,
        failedPlants: errorCount,
        totalImagesUploaded
      },
      details: results
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-upload-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Image Upload</h3>
          <p className="text-sm text-gray-600">
            Upload a .zip file containing folders named by plant ID, with images inside each folder.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Example structure: 123/image1.jpg, 123/image2.jpg, 456/flower.jpg
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Limits:</span> Up to 10 images per plant, 5MB per image
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Supported formats:</span> JPG, JPEG, PNG and WEBP
            </p>
          </div>
        </div>
        <button
          onClick={syncImagesFromStorage}
          disabled={syncing || uploading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ml-4 ${
            syncing || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          title="Repair image links from storage"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Repairing...' : 'Repair Image Links'}
        </button>
        <button
          onClick={fixSharedImages}
          disabled={fixingShared || syncing || uploading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ml-2 ${
            fixingShared || syncing || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
          title="Detect images shared between multiple plants and give each its own independent copy"
        >
          <Copy className={`w-4 h-4 ${fixingShared ? 'animate-spin' : ''}`} />
          {fixingShared ? 'Fixing...' : 'Fix Shared Images'}
        </button>
      </div>

      <div>
        <label className="block">
          <div className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors
            ${uploading ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-cyan-300 hover:border-cyan-500 hover:bg-cyan-50'}
          `}>
            <Upload className="w-12 h-12 mx-auto mb-3 text-cyan-500" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              {uploading ? 'Processing...' : 'Click to upload .zip file'}
            </p>
            <p className="text-xs text-gray-500">
              Maximum file size: 2GB
            </p>
          </div>
          <input
            type="file"
            accept=".zip"
            onChange={handleZipUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {uploading && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Processing plants...</span>
              <span className="font-medium text-gray-900">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Uploading images...</span>
              </div>
              <span className="font-medium text-gray-900">
                {progress.currentPlantImages} / {progress.totalImages}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.totalImages > 0 ? (progress.currentPlantImages / progress.totalImages) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">{successCount} plants</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <ImageIcon className="w-4 h-4" />
                <span className="font-medium">{totalImagesUploaded} images</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span className="font-medium">{errorCount} failed</span>
                </div>
              )}
            </div>
            <button
              onClick={downloadLog}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Log
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 flex items-start gap-3 ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Plant ID: {result.plantId}
                    </p>
                    <p className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.message}
                    </p>
                    {result.success && result.imageUrls && result.imageUrls.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {result.imageUrls.slice(0, 5).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`${result.plantId}-${i}`}
                            className="w-10 h-10 object-cover rounded border border-green-200"
                          />
                        ))}
                        {result.imageUrls.length > 5 && (
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded border border-gray-200 text-xs text-gray-600">
                            +{result.imageUrls.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
