import React, { useState, useEffect, useRef } from 'react';
import { supabase, Plant } from '../../lib/supabase';
import { Search, Plus, CreditCard as Edit, Loader, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlantWithImage extends Plant {
  primaryImageUrl?: string;
}

const CATEGORY_FIELDS: (keyof Plant)[] = [
  'category_shrub', 'category_tree', 'category_palm', 'category_perennial',
  'category_annual', 'category_biannual', 'category_grass', 'category_succulent',
  'category_bulb', 'category_acquatic', 'category_nonvascular', 'category_fern',
  'category_climbing_plant', 'category_formal_hedge', 'category_wild_hedge',
  'category_toxic_plant', 'category_ground_cover', 'category_culinary_plant',
  'category_medicinal_herbs',
];

const SCROLL_POSITION_KEY = 'admin-plant-list-scroll';
const SEARCH_TERM_KEY = 'admin-plant-list-search';

export const PlantList: React.FC = () => {
  const [plants, setPlants] = useState<PlantWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      return sessionStorage.getItem(SEARCH_TERM_KEY) || '';
    } catch {
      return '';
    }
  });
  const navigate = useNavigate();
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    if (!loading && plants.length > 0 && !scrollRestoredRef.current) {
      try {
        const savedScroll = sessionStorage.getItem(SCROLL_POSITION_KEY);
        if (savedScroll) {
          const scrollPosition = parseInt(savedScroll, 10);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo(0, scrollPosition);
            });
          });
        }
        scrollRestoredRef.current = true;
      } catch (error) {
        console.error('Error restoring scroll position:', error);
      }
    }
  }, [loading, plants]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SEARCH_TERM_KEY, searchTerm);
    } catch (error) {
      console.error('Error saving search term:', error);
    }
  }, [searchTerm]);


  const saveScrollAndNavigate = (path: string) => {
    try {
      sessionStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString());
    } catch {
      // ignore
    }
    navigate(path);
  };

  const loadPlants = async () => {
    setLoading(true);
    try {
      // Load plants
      const { data: plantsData, error: plantsError } = await supabase
        .from('plants_flat')
        .select('*')
        .order('botanical_name', { ascending: true });

      if (plantsError) throw plantsError;

      // Load primary images for all plants
      const { data: imagesData, error: imagesError } = await supabase
        .from('plant_images')
        .select('plant_id, image_url')
        .eq('is_primary', true);

      if (imagesError) throw imagesError;

      // Create a map of plant_id to primary image URL
      const imageMap = new Map(
        imagesData?.map(img => [img.plant_id, img.image_url]) || []
      );

      // Combine plants with their primary images
      const plantsWithImages: PlantWithImage[] = (plantsData || []).map(plant => ({
        ...plant,
        primaryImageUrl: imageMap.get(plant.id)
      }));

      setPlants(plantsWithImages);
    } catch (err) {
      console.error('Error loading plants:', err);
    } finally {
      setLoading(false);
    }
  };

  const deletePlant = async (plant: Plant) => {
    if (!window.confirm(`Are you sure you want to delete "${plant.botanical_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('plants_flat')
        .delete()
        .eq('id', plant.id);

      if (error) throw error;

      setPlants(plants.filter(p => p.id !== plant.id));
    } catch (err) {
      console.error('Error deleting plant:', err);
      alert('Failed to delete plant. Please try again.');
    }
  };

  const filteredPlants = plants.filter((plant) =>
    plant.botanical_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.common_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.common_name_de?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const uncategorizedPlants = plants.filter((plant) => !CATEGORY_FIELDS.some((field) => plant[field] === true));

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
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search plants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
        </div>
        <button
          onClick={() => saveScrollAndNavigate('/admin/plant/new?from=plants')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Plant
        </button>
      </div>

      <section className="bg-amber-50 rounded-lg border border-amber-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Plants without a category</h2>
            <p className="text-sm text-gray-600 mt-1">These plants have no category assigned yet.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">{uncategorizedPlants.length}</span>
        </div>
        {uncategorizedPlants.length === 0 ? (
          <p className="text-sm text-green-700">All plants have at least one category.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-amber-200 bg-white">
            <table className="w-full">
              <thead className="bg-amber-100/60 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Botanical Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Common Name</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {uncategorizedPlants.map((plant) => (
                  <tr key={plant.id} className="hover:bg-amber-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{plant.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{plant.botanical_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{[plant.common_name_de, plant.common_name_en].filter(Boolean).join(' · ') || '-'}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      <button
                        onClick={() => saveScrollAndNavigate(`/admin/plant/${plant.id}?from=plants`)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Botanical Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Common Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPlants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No plants found
                  </td>
                </tr>
              ) : (
                filteredPlants.map((plant) => (
                  <tr key={plant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plant.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {plant.botanical_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {[plant.common_name_de, plant.common_name_en].filter(Boolean).join(' · ') || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {plant.primaryImageUrl ? (
                        <img
                          src={plant.primaryImageUrl}
                          alt={plant.botanical_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => saveScrollAndNavigate(`/admin/plant/${plant.id}?from=plants`)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => deletePlant(plant)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredPlants.length} of {plants.length} plants
      </div>
    </div>
  );
};
