import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { convertToPng } from '../../lib/imageConverter';
import { Upload, CheckCircle, XCircle, Download, Image as ImageIcon, RefreshCw } from 'lucide-react';
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
            if (/\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
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

          // Delete existing images for this plant to avoid duplicates
          await supabase
            .from('plant_images')
            .delete()
            .eq('plant_id', parseInt(plantId));

          // Upload up to 10 images for this plant
          const maxImages = Math.min(imageFiles.length, 10);

          for (let j = 0; j < maxImages; j++) {
            const imageFile = imageFiles[j];
            const arrayBuffer = await imageFile.async('arraybuffer');

            const fileName = imageFile.name.split('/').pop()!;

            // Check file size (100MB limit per file)
            const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);
            if (fileSizeMB > 100) {
              throw new Error(`Image '${fileName}' is too large (${fileSizeMB.toFixed(1)}MB). Maximum size is 100MB.`);
            }

            const blob = await convertToPng(arrayBuffer);
            const storageFileName = `${plantId}_${j + 1}.webp`;

            const { error: uploadError } = await supabase.storage
              .from('plant-images')
              .upload(storageFileName, blob, {
                contentType: 'image/webp',
                upsert: true
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

          // Insert all images into plant_images table
          if (uploadedUrls.length > 0) {
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
        .select('id, botanical_name, image_url')
        .is('image_url', null);

      if (plantsError) throw plantsError;

      let updateCount = 0;

      for (const plant of plants || []) {
        const matchingFiles = files?.filter(file => {
          const fileName = file.name.toLowerCase();
          const plantIdStr = plant.id.toString();
          return fileName.startsWith(plantIdStr + '_') ||
                 fileName.startsWith('plant-' + plantIdStr + '-');
        });

        if (matchingFiles && matchingFiles.length > 0) {
          const primaryFile = matchingFiles[0];
          const { data: { publicUrl } } = supabase.storage
            .from('plant-images')
            .getPublicUrl(primaryFile.name);

          const { error: updateError } = await supabase
            .from('plants_flat')
            .update({ image_url: publicUrl })
            .eq('id', plant.id);

          if (!updateError) {
            updateCount++;
          }
        }
      }

      alert(`Successfully synced ${updateCount} images from storage!`);
    } catch (err) {
      console.error('Error syncing images:', err);
      alert('Failed to sync images. Check console for details.');
    } finally {
      setSyncing(false);
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
              <span className="font-medium">Limits:</span> Up to 10 images per plant, 100MB per image
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Supported formats:</span> JPG, JPEG, PNG, GIF, WEBP (all converted to PNG automatically)
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
          title="Sync uploaded images with database"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Storage'}
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
