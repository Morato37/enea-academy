import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Plant } from '../lib/supabase';
import { PlantFilterState } from '../components/Filters/PlantFilters';

interface PlantsPageContextType {
  plants: Plant[];
  filteredPlants: Plant[];
  loading: boolean;
  refreshing: boolean;
  filters: PlantFilterState;
  setFilters: React.Dispatch<React.SetStateAction<PlantFilterState>>;
  fetchPlants: (isRefresh?: boolean) => Promise<void>;
  handleRefresh: () => void;
  plantImagesMap: Map<number, string[]>;
}

const PlantsPageContext = createContext<PlantsPageContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'plants-view-state';

const defaultFilters: PlantFilterState = {
  search: '',
  climateZones: [],
  plantTypes: [],
  sunRequirements: [],
  usageCategories: [],
  layers: [],
  sizes: [],
  colors: [],
  biodiversity: [],
  nativeStatus: [],
  leafPersistence: [],
  treeOfTheFuture: false,
  treeOfTheFutureDrought: false,
  treeOfTheFutureFlooding: false,
  treeOfTheFutureSalt: false,
  naturalisticPlantingDesign: false,
  gardenStyles: [],
};

export const PlantsPageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plantImagesMap, setPlantImagesMap] = useState<Map<number, string[]>>(new Map());
  const [filters, setFilters] = useState<PlantFilterState>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultFilters, ...parsed };
      }
    } catch (error) {
      console.error('Error loading plants view state:', error);
    }
    return defaultFilters;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving plants view state:', error);
    }
  }, [filters]);

  useEffect(() => {
    fetchPlants();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPlants(true);
      }
    };

    const handleFocus = () => fetchPlants(true);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [plants, filters]);

  const fetchPlants = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const pageSize = 500;
      const plantsData: Plant[] = [];
      let offset = 0;

      while (true) {
        const plantsResult = await supabase
          .from('plants_flat')
          .select('*, plant_images(plant_id, image_url, is_primary, display_order)')
          .order('botanical_name')
          .order('id')
          .range(offset, offset + pageSize - 1);

        if (plantsResult.error) throw plantsResult.error;

        const page = (plantsResult.data || []) as Plant[];
        plantsData.push(...page);

        if (page.length < pageSize) break;
        offset += pageSize;
      }

      setPlants(plantsData);

      const map = new Map<number, string[]>();
      for (const plant of plantsData) {
        const imgs = (plant as any).plant_images as { plant_id: number; image_url: string; is_primary: boolean; display_order: number }[] | null;
        if (imgs && imgs.length > 0) {
          const sorted = [...imgs].sort((a, b) => {
            if (b.is_primary !== a.is_primary) return (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0);
            return a.display_order - b.display_order;
          });
          const imageUrls = [...new Set(
            sorted
              .map(i => i.image_url)
              .filter((url): url is string => Boolean(url))
          )];
          map.set(plant.id, imageUrls);
        }
      }
      setPlantImagesMap(map);
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchPlants(true);
  };

  const getSizeCategory = (sizeStr: string | undefined): string[] => {
    if (!sizeStr) return [];
    const normalized = sizeStr.toLowerCase().trim();
    if (normalized === 'short' || normalized === 'medium' || normalized === 'tall') {
      return [normalized];
    }
    return [];
  };

  const hexToColorCategory = (hex: string | undefined): string[] => {
    if (!hex || hex === '' || hex.trim() === '') return [];

    const normalized = hex.toLowerCase().trim().replace('#', '');
    if (normalized.length !== 6) return [];

    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) return [];

    const categories: string[] = [];
    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    const minVal = Math.min(r, g, b);
    const maxVal = Math.max(r, g, b);

    if (minVal >= 250 && maxVal >= 250 && saturation <= 5) {
      return ['white'];
    }

    if (r <= 30 && g <= 30 && b <= 30) {
      return ['black'];
    }

    if (saturation < 25 && brightness >= 100 && brightness <= 200) {
      return ['grey'];
    }

    if (r > Math.max(g, b) + 50 && r > 140 && saturation > 50) {
      categories.push('red');
    }

    if (r > 180 && g > 80 && g > b + 40 && r > g + 20 && b < 140) {
      categories.push('orange');
    }

    if (r > 180 && g > 180 && b < Math.min(r, g) - 40) {
      categories.push('yellow');
    }

    if (r > 160 && g > 120 && r > g && g > b && b > 50 && b < 150 && saturation > 40) {
      categories.push('gold');
    }

    if (g > Math.max(r, b) + 20 && g > 80 && saturation > 30) {
      categories.push('green');
    }

    if (b > Math.max(r, g) + 40 && b > 140 && saturation > 50) {
      categories.push('blue');
    }

    if (r > 120 && b > 120 && g < Math.min(r, b) - 20 && Math.abs(r - b) < 60 && brightness < 180) {
      categories.push('purple');
    }

    if (r > 180 && g > 120 && b > 120 && r > g + 20 && r > b + 20 && brightness > 150) {
      categories.push('pink');
    }

    if (r > 200 && b > 200 && g < Math.min(r, b) - 40 && brightness > 180) {
      categories.push('pink');
    }

    if (r > g && r > b && g > 50 && b > 40 && brightness < 180 && saturation < 100 && r < 200) {
      categories.push('brown');
    }

    return categories;
  };

  const plantHasColor = (plant: Plant, colorCategories: string[]): boolean => {
    const monthColors = [
      plant.color_jan,
      plant.color_feb,
      plant.color_mar,
      plant.color_apr,
      plant.color_may,
      plant.color_jun,
      plant.color_jul,
      plant.color_aug,
      plant.color_sep,
      plant.color_oct,
      plant.color_nov,
      plant.color_dec,
      plant.color2_jan,
      plant.color2_feb,
      plant.color2_mar,
      plant.color2_apr,
      plant.color2_may,
      plant.color2_jun,
      plant.color2_jul,
      plant.color2_aug,
      plant.color2_sep,
      plant.color2_oct,
      plant.color2_nov,
      plant.color2_dec,
    ];

    for (const monthColor of monthColors) {
      if (monthColor) {
        const detectedCategories = hexToColorCategory(monthColor);
        if (detectedCategories.some(cat => colorCategories.includes(cat))) {
          return true;
        }
      }
    }

    return false;
  };

  const applyFilters = () => {
    let filtered = [...plants];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase().replace(/\s+/g, ' ').trim();
      filtered = filtered.filter(
        (plant) =>
          plant.botanical_name.toLowerCase().replace(/\s+/g, ' ').includes(searchLower) ||
          plant.common_name_en?.toLowerCase().replace(/\s+/g, ' ').includes(searchLower) ||
          plant.common_name_de?.toLowerCase().replace(/\s+/g, ' ').includes(searchLower)
      );
    }

    if (filters.climateZones.length > 0) {
      filtered = filtered.filter((plant) =>
        filters.climateZones.some((zone) => {
          const zoneKey = `zone_${zone.toLowerCase()}` as keyof Plant;
          return plant[zoneKey] === true;
        })
      );
    }

    if (filters.plantTypes.length > 0) {
      filtered = filtered.filter((plant) =>
        filters.plantTypes.some((type) => {
          const typeKey = `category_${type.toLowerCase()}` as keyof Plant;
          return plant[typeKey] === true;
        })
      );
    }

    if (filters.sunRequirements.length > 0) {
      filtered = filtered.filter((plant) =>
        filters.sunRequirements.some((req) => {
          const reqKey = `exposure_${req}` as keyof Plant;
          return plant[reqKey] === true;
        })
      );
    }

    if (filters.usageCategories.length > 0) {
      filtered = filtered.filter((plant) =>
        filters.usageCategories.some((usage) => {
          const usageKey = `usage_${usage}` as keyof Plant;
          return plant[usageKey] === true;
        })
      );
    }

    if (filters.layers.length > 0) {
      filtered = filtered.filter((plant) =>
        plant.layer && filters.layers.includes(plant.layer)
      );
    }

    if (filters.sizes.length > 0) {
      filtered = filtered.filter((plant) => {
        if (plant.category_tree) return true; // trees are excluded from size filtering
        const plantSizeCategories = getSizeCategory(plant.perennial_size);
        if (plantSizeCategories.length === 0) return true; // no size data, pass through
        return filters.sizes.some(size => plantSizeCategories.includes(size));
      });
    }

    if (filters.treeOfTheFuture) {
      filtered = filtered.filter((plant) => plant.tree_of_the_future === true);
    }

    if (filters.treeOfTheFutureDrought) {
      filtered = filtered.filter((plant) => plant.tree_of_the_future_drought === true);
    }

    if (filters.treeOfTheFutureFlooding) {
      filtered = filtered.filter((plant) => plant.tree_of_the_future_flooding === true);
    }

    if (filters.treeOfTheFutureSalt) {
      filtered = filtered.filter((plant) => plant.tree_of_the_future_salt === true);
    }

    if (filters.naturalisticPlantingDesign) {
      filtered = filtered.filter((plant) => plant.layer && plant.layer.trim() !== '');
    }

    if (filters.leafPersistence.length > 0) {
      filtered = filtered.filter((plant) => {
        return filters.leafPersistence.some((persistence) => {
          if (persistence === 'evergreen') {
            return plant.characteristic_evergreen === true;
          }
          if (persistence === 'deciduous') {
            return plant.characteristic_deciduous === true;
          }
          return false;
        });
      });
    }

    if (filters.nativeStatus.length > 0) {
      filtered = filtered.filter((plant) => {
        return filters.nativeStatus.some((status) => {
          if (status === 'ch_native') {
            return plant.characteristic_native === true;
          }
          return false;
        });
      });
    }

    if (filters.biodiversity.length > 0) {
      filtered = filtered.filter((plant) => {
        return filters.biodiversity.every((biodiv) => {
          switch (biodiv) {
            case 'butterflies':
              return plant.characteristic_butterflies === true;
            case 'bees':
              return plant.characteristic_bees === true;
            case 'honeybees':
              return plant.characteristic_honeybees === true;
            case 'bumblebees':
              return plant.characteristic_bumblebees === true;
            case 'hoverflies':
              return plant.characteristic_hoverflies === true;
            case 'beetles':
              return plant.characteristic_beetles === true;
            case 'birds':
              return plant.characteristic_birds === true;
            default:
              return true;
          }
        });
      });
    }

    if (filters.colors.length > 0) {
      filtered = filtered.filter((plant) => plantHasColor(plant, filters.colors));
    }

    if (filters.gardenStyles.length > 0) {
      filtered = filtered.filter((plant) =>
        filters.gardenStyles.some((style) => {
          const key = `garden_style_${style}` as keyof Plant;
          return plant[key] === true;
        })
      );
    }

    setFilteredPlants(filtered);
  };

  const value: PlantsPageContextType = {
    plants,
    filteredPlants,
    loading,
    refreshing,
    filters,
    setFilters,
    fetchPlants,
    handleRefresh,
    plantImagesMap,
  };

  return (
    <PlantsPageContext.Provider value={value}>
      {children}
    </PlantsPageContext.Provider>
  );
};

export const usePlantsPage = () => {
  const context = useContext(PlantsPageContext);
  if (context === undefined) {
    throw new Error('usePlantsPage must be used within a PlantsPageProvider');
  }
  return context;
};
