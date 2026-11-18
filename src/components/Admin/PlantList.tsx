import React, { useState, useEffect, useRef } from 'react';
import { supabase, Plant } from '../../lib/supabase';
import { Search, Plus, CreditCard as Edit, Loader, Trash2, SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';
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

type FilterMode = 'has' | 'has_not';
type FilterState = Record<string, FilterMode>;

const ATTRIBUTE_FILTER_GROUPS: Array<{ label: string; fields: (keyof Plant)[] }> = [
  { label: 'Names and general data', fields: ['botanical_name', 'common_name_de', 'common_name_en', 'image_url', 'layer', 'perennial_size', 'height_min_cm', 'height_max_cm'] },
  { label: 'Plant categories', fields: CATEGORY_FIELDS },
  { label: 'Exposure', fields: ['exposure_sun', 'exposure_shade', 'exposure_halfshade'] },
  { label: 'Soil types', fields: ['soil_sandy', 'soil_clay', 'soil_loamy'] },
  { label: 'Usage categories', fields: ['usage_solitary_garden', 'usage_solitary_park', 'usage_trees_in_groups', 'usage_grasses', 'usage_ferns', 'usage_waterplants_pond', 'usage_medicinal_herbs', 'usage_ground_cover', 'usage_seasonal', 'usage_climbing', 'usage_tuberous_rooted', 'usage_formal_hedge', 'usage_wild_hedge', 'usage_tropical'] },
  { label: 'Climate zones', fields: ['zone_1a', 'zone_1b', 'zone_2a', 'zone_2b', 'zone_3a', 'zone_3b', 'zone_4a', 'zone_4b', 'zone_5a', 'zone_5b', 'zone_6a', 'zone_6b', 'zone_7a', 'zone_7b', 'zone_8a', 'zone_8b', 'zone_9a', 'zone_9b', 'zone_10a', 'zone_10b'] },
  { label: 'Seasonal colors', fields: ['color_jan', 'color_feb', 'color_mar', 'color_apr', 'color_may', 'color_jun', 'color_jul', 'color_aug', 'color_sep', 'color_oct', 'color_nov', 'color_dec', 'color2_jan', 'color2_feb', 'color2_mar', 'color2_apr', 'color2_may', 'color2_jun', 'color2_jul', 'color2_aug', 'color2_sep', 'color2_oct', 'color2_nov', 'color2_dec'] },
  { label: 'Tree of the Future', fields: ['tree_of_the_future', 'tree_of_the_future_drought', 'tree_of_the_future_flooding', 'tree_of_the_future_salt'] },
  { label: 'Garden styles', fields: ['garden_style_new_japanese', 'garden_style_alpine', 'garden_style_residential', 'garden_style_mediterranean', 'garden_style_swiss_farmhouse', 'garden_style_wild'] },
  { label: 'Characteristics', fields: ['characteristic_evergreen', 'characteristic_deciduous', 'characteristic_native', 'characteristic_butterflies', 'characteristic_bees', 'characteristic_honeybees', 'characteristic_bumblebees', 'characteristic_hoverflies', 'characteristic_beetles', 'characteristic_birds'] },
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
  const [attributeFilters, setAttributeFilters] = useState<FilterState>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
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
      const pageSize = 500;
      const plantsData: Plant[] = [];
      let plantsOffset = 0;

      while (true) {
        const { data: page, error: plantsError } = await supabase
          .from('plants_flat')
          .select('*')
          .order('botanical_name', { ascending: true })
          .order('id', { ascending: true })
          .range(plantsOffset, plantsOffset + pageSize - 1);

        if (plantsError) throw plantsError;

        const pagePlants = (page || []) as Plant[];
        plantsData.push(...pagePlants);
        if (pagePlants.length < pageSize) break;
        plantsOffset += pageSize;
      }

      const imagesData: Array<{ plant_id: number; image_url: string }> = [];
      let imagesOffset = 0;

      while (true) {
        const { data: page, error: imagesError } = await supabase
          .from('plant_images')
          .select('plant_id, image_url')
          .eq('is_primary', true)
          .range(imagesOffset, imagesOffset + pageSize - 1);

        if (imagesError) throw imagesError;

        const pageImages = page || [];
        imagesData.push(...pageImages);
        if (pageImages.length < pageSize) break;
        imagesOffset += pageSize;
      }

      const imageMap = new Map(
        imagesData.map(img => [img.plant_id, img.image_url])
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

  const hasValue = (value: Plant[keyof Plant]): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return true;
    return value !== null && value !== undefined && String(value).trim().length > 0;
  };

  const formatAttributeLabel = (field: keyof Plant): string => {
    return String(field)
      .replace(/^category_/, '')
      .replace(/^exposure_/, '')
      .replace(/^soil_/, '')
      .replace(/^usage_/, '')
      .replace(/^zone_/, 'Zone ')
      .replace(/^color2_/, 'Second color ')
      .replace(/^color_/, 'Color ')
      .replace(/^garden_style_/, '')
      .replace(/^characteristic_/, '')
      .replace(/^tree_of_the_future_?/, 'Tree of the Future ')
      .replace(/_([a-z])/g, (_, letter: string) => ` ${letter.toUpperCase()}`)
      .replace(/^(.)/, (_, letter: string) => letter.toUpperCase())
      .trim();
  };

  const activeFilterCount = Object.keys(attributeFilters).length;
  const visibleFilterGroups = ATTRIBUTE_FILTER_GROUPS
    .map(group => ({
      ...group,
      fields: group.fields.filter(field => formatAttributeLabel(field).toLowerCase().includes(filterSearch.toLowerCase())),
    }))
    .filter(group => group.fields.length > 0);

  const filteredPlants = plants.filter((plant) => {
    const matchesSearch = [plant.botanical_name, plant.common_name_en, plant.common_name_de]
      .some(value => value?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAttributes = Object.entries(attributeFilters).every(([field, mode]) => {
      const value = hasValue(plant[field as keyof Plant]);
      return mode === 'has' ? value : !value;
    });
    return matchesSearch && matchesAttributes;
  });
  const uncategorizedPlants = plants.filter((plant) => !CATEGORY_FIELDS.some((field) => plant[field] === true));

  const updateAttributeFilter = (field: keyof Plant, mode: string) => {
    setAttributeFilters(current => {
      const next = { ...current };
      if (mode === 'has' || mode === 'has_not') next[String(field)] = mode;
      else delete next[String(field)];
      return next;
    });
  };

  const clearAttributeFilters = () => setAttributeFilters({});

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

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={() => setFiltersOpen(open => !open)}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
          aria-expanded={filtersOpen}
        >
          <span className="flex items-center gap-2 font-semibold text-gray-900">
            <SlidersHorizontal className="w-5 h-5 text-green-600" />
            Attribute filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">{activeFilterCount} active</span>
            )}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>

        {filtersOpen && (
          <div className="border-t border-gray-200 px-5 pb-5 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">Show plants that have or do not have a value for each attribute.</p>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearAttributeFilters} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
                  <RotateCcw className="w-4 h-4" />
                  Reset filters
                </button>
              )}
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Find an attribute..."
                value={filterSearch}
                onChange={event => setFilterSearch(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleFilterGroups.map(group => (
                <div key={group.label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">{group.label}</h3>
                  <div className="space-y-2">
                    {group.fields.map(field => (
                      <label key={String(field)} className="flex items-center justify-between gap-2 text-sm text-gray-700">
                        <span className="truncate" title={formatAttributeLabel(field)}>{formatAttributeLabel(field)}</span>
                        <select
                          value={attributeFilters[String(field)] || ''}
                          onChange={event => updateAttributeFilter(field, event.target.value)}
                          className="w-28 shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                          <option value="">Any</option>
                          <option value="has">Has</option>
                          <option value="has_not">Has not</option>
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

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
