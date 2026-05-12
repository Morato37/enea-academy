import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { convertToPng } from '../../lib/imageConverter';
import { Upload, X, Check, Trash2 } from 'lucide-react';

interface ImageUploaderProps {
  itemId: number;
  itemName: string;
  currentImageUrl?: string;
  type: 'plant' | 'stone';
  onUploadComplete: () => void;
}

interface ImageRecord {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  itemId,
  itemName,
  currentImageUrl,
  type,
  onUploadComplete,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadImages();
  }, [itemId, type]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const table = type === 'plant' ? 'plant_images' : 'stone_images';
      const column = type === 'plant' ? 'plant_id' : 'stone_id';

      const { data, error } = await supabase
        .from(table)
        .select('id, image_url, display_order, is_primary')
        .eq(column, itemId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      const pngBlob = await convertToPng(file);
      const fileName = `${type}-${itemId}-${Date.now()}.webp`;
      const bucket = type === 'plant' ? 'plant-images' : 'stone-images';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, pngBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const table = type === 'plant' ? 'plant_images' : 'stone_images';
      const column = type === 'plant' ? 'plant_id' : 'stone_id';
      const nextOrder = images.length;
      const isFirstImage = images.length === 0;

      const { error: insertError } = await supabase
        .from(table)
        .insert({
          [column]: itemId,
          image_url: publicUrl,
          display_order: nextOrder,
          is_primary: isFirstImage
        });

      if (insertError) throw insertError;

      if (isFirstImage) {
        const mainTable = type === 'plant' ? 'plants_flat' : 'stones';
        await supabase
          .from(mainTable)
          .update({ image_url: publicUrl })
          .eq('id', itemId);
      }

      setSuccess(true);
      await loadImages();
      setTimeout(() => {
        onUploadComplete();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const setPrimaryImage = async (imageId: string, imageUrl: string) => {
    try {
      const table = type === 'plant' ? 'plant_images' : 'stone_images';
      const column = type === 'plant' ? 'plant_id' : 'stone_id';

      // Unset all primary flags for this item
      await supabase
        .from(table)
        .update({ is_primary: false })
        .eq(column, itemId);

      // Set this image as primary
      const { error } = await supabase
        .from(table)
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) throw error;

      // Update main table's image_url
      const mainTable = type === 'plant' ? 'plants_flat' : 'stones';
      await supabase
        .from(mainTable)
        .update({ image_url: imageUrl })
        .eq('id', itemId);

      await loadImages();
      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary image');
    }
  };

  const deleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const table = type === 'plant' ? 'plant_images' : 'stone_images';
      const column = type === 'plant' ? 'plant_id' : 'stone_id';

      // Check if this is the primary image
      const deletingPrimary = images.find(img => img.id === imageId)?.is_primary;

      // Delete the image record
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      // Delete from storage
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        const bucket = type === 'plant' ? 'plant-images' : 'stone-images';
        await supabase.storage.from(bucket).remove([fileName]);
      }

      // If we deleted the primary image, set a new primary
      if (deletingPrimary) {
        const remainingImages = images.filter(img => img.id !== imageId);
        if (remainingImages.length > 0) {
          // Set the first remaining image as primary
          const newPrimary = remainingImages[0];
          await supabase
            .from(table)
            .update({ is_primary: true })
            .eq('id', newPrimary.id);

          // Update main table's image_url
          const mainTable = type === 'plant' ? 'plants_flat' : 'stones';
          await supabase
            .from(mainTable)
            .update({ image_url: newPrimary.image_url })
            .eq('id', itemId);
        } else {
          // No images left, clear the main table's image_url
          const mainTable = type === 'plant' ? 'plants_flat' : 'stones';
          await supabase
            .from(mainTable)
            .update({ image_url: null })
            .eq('id', itemId);
        }
      }

      await loadImages();
      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 100 * 1024 * 1024) {
        setError(`${file.name}: File size must be less than 100MB`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        setError(`${file.name}: File must be an image`);
        continue;
      }

      await uploadImage(file);
    }

    setUploading(false);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) {
        setError(`${file.name}: File size must be less than 100MB`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        setError(`${file.name}: File must be an image`);
        continue;
      }

      await uploadImage(file);
    }

    setUploading(false);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{itemName}</p>
            <p className="text-xs text-gray-500">
              {images.length} image{images.length !== 1 ? 's' : ''}
            </p>
          </div>

          <label className="relative">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                success
                  ? 'bg-green-600 text-white'
                  : uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={(e) => {
                e.preventDefault();
                (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
              }}
            >
              {success ? (
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Added
                </span>
              ) : uploading ? (
                'Uploading...'
              ) : (
                <span className="flex items-center gap-1">
                  <Upload className="w-4 h-4" />
                  Add Images
                </span>
              )}
            </button>
          </label>
        </div>

        {isDragging && (
          <div className="mt-3 text-center">
            <p className="text-sm text-blue-600 font-medium">Drop images here to upload</p>
          </div>
        )}

        {!isDragging && images.length === 0 && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">Drag and drop images here or use the button above</p>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-gray-500">Loading images...</div>
      ) : images.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-600">Click on an image to set it as primary</p>
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, index) => (
              <div
                key={img.id}
                className="relative group cursor-pointer"
                onClick={() => !img.is_primary && setPrimaryImage(img.id, img.image_url)}
                title={img.is_primary ? 'Primary image' : 'Click to set as primary'}
              >
                <img
                  src={img.image_url}
                  alt={`${itemName} ${index + 1}`}
                  className={`w-full aspect-square object-cover rounded transition-all ${
                    img.is_primary
                      ? 'border-4 border-green-600 ring-2 ring-green-200'
                      : 'border-2 border-gray-200 hover:border-green-400'
                  }`}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteImage(img.id, img.image_url);
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Delete image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                {img.is_primary && (
                  <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded font-semibold shadow-lg">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
