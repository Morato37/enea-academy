import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { convertToPng } from '../../lib/imageConverter';
import { Download, Loader, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface FetchResult {
  plantId: number;
  botanicalName: string;
  success: boolean;
  message: string;
  imageUrl?: string;
}

export const AutoImageFetcher: React.FC = () => {
  const [fetching, setFetching] = useState(false);
  const [results, setResults] = useState<FetchResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const fetchImagesFromPexels = async () => {
    setFetching(true);
    setResults([]);

    try {
      const { data: plants, error: plantsError } = await supabase
        .from('plants_flat')
        .select('id, botanical_name, image_url')
        .is('image_url', null)
        .order('id', { ascending: true });

      if (plantsError) throw plantsError;
      if (!plants || plants.length === 0) {
        alert('All plants already have images!');
        setFetching(false);
        return;
      }

      setProgress({ current: 0, total: plants.length });
      const fetchResults: FetchResult[] = [];

      for (let i = 0; i < plants.length; i++) {
        const plant = plants[i];

        try {
          const searchQuery = plant.botanical_name || `plant ${plant.id}`;
          const pexelsResponse = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=square`,
            {
              headers: {
                Authorization: import.meta.env.VITE_PEXELS_API_KEY || ''
              }
            }
          );

          if (!pexelsResponse.ok) {
            throw new Error('Pexels API request failed');
          }

          const pexelsData = await pexelsResponse.json();

          if (pexelsData.photos && pexelsData.photos.length > 0) {
            const pexelsImageUrl: string = pexelsData.photos[0].src.medium;

            const imageResponse = await fetch(pexelsImageUrl);
            if (!imageResponse.ok) throw new Error('Failed to download Pexels image');
            const arrayBuffer = await imageResponse.arrayBuffer();

            const pngBlob = await convertToPng(arrayBuffer);
            const storageFileName = `${plant.id}_pexels.webp`;

            const { error: uploadError } = await supabase.storage
              .from('plant-images')
              .upload(storageFileName, pngBlob, {
                contentType: 'image/webp',
                upsert: true
              });

            if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage
              .from('plant-images')
              .getPublicUrl(storageFileName);

            const { data: existingImages } = await supabase
              .from('plant_images')
              .select('id')
              .eq('plant_id', plant.id);

            const isFirstImage = !existingImages || existingImages.length === 0;

            const { error: insertError } = await supabase
              .from('plant_images')
              .insert({
                plant_id: plant.id,
                image_url: publicUrl,
                display_order: isFirstImage ? 0 : (existingImages?.length ?? 0),
                is_primary: isFirstImage
              });

            if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

            const { error: updateError } = await supabase
              .from('plants_flat')
              .update({ image_url: publicUrl })
              .eq('id', plant.id);

            if (updateError) throw updateError;

            fetchResults.push({
              plantId: plant.id,
              botanicalName: plant.botanical_name || `Plant ${plant.id}`,
              success: true,
              message: 'Image fetched and stored as PNG',
              imageUrl: publicUrl
            });
          } else {
            fetchResults.push({
              plantId: plant.id,
              botanicalName: plant.botanical_name || `Plant ${plant.id}`,
              success: false,
              message: 'No images found on Pexels'
            });
          }
        } catch (err) {
          fetchResults.push({
            plantId: plant.id,
            botanicalName: plant.botanical_name || `Plant ${plant.id}`,
            success: false,
            message: err instanceof Error ? err.message : 'Unknown error'
          });
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        setProgress({ current: i + 1, total: plants.length });
        setResults([...fetchResults]);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setFetching(false);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Auto-Fetch Plant Images
        </h3>
        <p className="text-sm text-gray-600">
          Automatically search and add images for plants using their botanical names via Pexels API. Images are converted to PNG and stored in Supabase Storage.
        </p>
        <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-medium mb-1">Pexels API Key Required</p>
            <p>
              Get a free API key from{' '}
              <a
                href="https://www.pexels.com/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-900"
              >
                pexels.com/api
              </a>
              {' '}and add it as <code className="bg-amber-100 px-1 rounded">VITE_PEXELS_API_KEY</code> in your .env file.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={fetchImagesFromPexels}
        disabled={fetching}
        className={`
          w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
          ${fetching
            ? 'bg-gray-300 cursor-not-allowed text-gray-600'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
      >
        {fetching ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Fetching Images...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Auto-Fetch Images for Plants Without Images
          </>
        )}
      </button>

      {fetching && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Processing plants...</span>
            <span className="font-medium text-gray-900">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">{successCount} successful</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-4 h-4" />
                <span className="font-medium">{errorCount} failed</span>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
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
                      {result.botanicalName}
                    </p>
                    <p className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.message}
                    </p>
                  </div>
                  {result.imageUrl && (
                    <img
                      src={result.imageUrl}
                      alt={result.botanicalName}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
