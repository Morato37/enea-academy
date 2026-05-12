import React, { useState, useEffect, useCallback } from 'react';
import { supabase, Plant, Stone } from '../../lib/supabase';
import { ImageUploader } from './ImageUploader';
import { Search, Loader, RefreshCw } from 'lucide-react';

interface ImageManagementProps {
  type: 'plant' | 'stone';
}

export const ImageManagement: React.FC<ImageManagementProps> = ({ type }) => {
  const [items, setItems] = useState<(Plant | Stone)[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'with-image' | 'without-image'>('all');

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const table = type === 'plant' ? 'plants_flat' : 'stones';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const syncImagesFromStorage = async () => {
    setSyncing(true);
    try {
      const bucketName = type === 'plant' ? 'plant-images' : 'stone-images';
      const table = type === 'plant' ? 'plants_flat' : 'stones';

      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 10000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) throw listError;

      const itemsWithoutImages = items.filter(item => !item.image_url);
      let updateCount = 0;

      for (const item of itemsWithoutImages) {
        const matchingFiles = files?.filter(file => {
          const fileName = file.name.toLowerCase();
          return fileName.startsWith(item.id.toString() + '_');
        });

        if (matchingFiles && matchingFiles.length > 0) {
          const primaryFile = matchingFiles[0];
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(primaryFile.name);

          const { error: updateError } = await supabase
            .from(table)
            .update({ image_url: publicUrl })
            .eq('id', item.id);

          if (!updateError) {
            updateCount++;
          }
        }
      }

      alert(`Successfully synced ${updateCount} images from storage!`);
      await loadItems();
    } catch (err) {
      console.error('Error syncing images:', err);
      alert('Failed to sync images. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = items.filter((item) => {
    const name = type === 'plant'
      ? (item as Plant).botanical_name
      : (item as Stone).name;

    const matchesSearch = name ? name.toLowerCase().includes(searchTerm.toLowerCase()) : false;

    const matchesFilter =
      filter === 'all' ||
      (filter === 'with-image' && item.image_url) ||
      (filter === 'without-image' && !item.image_url);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: items.length,
    withImage: items.filter((i) => i.image_url).length,
    withoutImage: items.filter((i) => !i.image_url).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('with-image')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'with-image'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            With Image ({stats.withImage})
          </button>
          <button
            onClick={() => setFilter('without-image')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'without-image'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Without Image ({stats.withoutImage})
          </button>
          <button
            onClick={syncImagesFromStorage}
            disabled={syncing || stats.withoutImage === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              syncing || stats.withoutImage === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Storage'}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${type}s...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No {type}s found matching your criteria
          </div>
        ) : (
          filteredItems.map((item) => {
            const itemName = type === 'plant'
              ? (item as Plant).botanical_name
              : (item as Stone).name;

            return (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <ImageUploader
                  itemId={item.id}
                  itemName={itemName || `Unnamed ${type} #${item.id}`}
                  currentImageUrl={item.image_url}
                  type={type}
                  onUploadComplete={loadItems}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
