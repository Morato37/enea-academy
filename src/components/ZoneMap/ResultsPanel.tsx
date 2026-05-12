import React, { useState, useMemo, useEffect } from 'react';
import { Plant, Stone, supabase } from '../../lib/supabase';
import { PlantCard } from '../Cards/PlantCard';
import { StoneCard } from '../Cards/StoneCard';
import { TileCombinationModal } from '../Stones/TileCombinationModal';
import { UsageCategorySelector, PlantUsageCategory, usageCategoryLabels } from './UsageCategorySelector';
import { PlantCategorySelector, PlantCategory } from './PlantCategorySelector';
import { useSelections } from '../../contexts/SelectionsContext';
import { Leaf, Mountain, X, ArrowLeft, Sun, CloudRain, CloudSun, Palette, ChevronDown } from 'lucide-react';

interface ResultsPanelProps {
  plants: Plant[];
  stones: Stone[];
  zoneCode: string;
  cityName: string;
  onClose: () => void;
  onUsageFilterChange: (categories: PlantUsageCategory[]) => void;
}

type SunExposure = 'sun' | 'shade' | 'halfshade';

const COLOR_OPTIONS = [
  { name: 'white', label: 'White', hex: '#FFFFFF' },
  { name: 'yellow', label: 'Yellow', hex: '#FFFF00' },
  { name: 'gold', label: 'Gold', hex: '#FFD700' },
  { name: 'orange', label: 'Orange', hex: '#FFA500' },
  { name: 'red', label: 'Red', hex: '#FF0000' },
  { name: 'pink', label: 'Pink', hex: '#FFC0CB' },
  { name: 'purple', label: 'Purple', hex: '#800080' },
  { name: 'blue', label: 'Blue', hex: '#0000FF' },
  { name: 'green', label: 'Green', hex: '#00FF00' },
  { name: 'brown', label: 'Brown', hex: '#A52A2A' },
  { name: 'grey', label: 'Grey', hex: '#808080' },
  { name: 'black', label: 'Black', hex: '#000000' },
];

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  plants,
  stones,
  zoneCode,
  cityName,
  onClose,
  onUsageFilterChange,
}) => {
  const { addTileCombination } = useSelections();
  const [activeTab, setActiveTab] = useState<'plants' | 'stones'>('plants');
  const [plantImagesMap, setPlantImagesMap] = useState<Map<number, string[]>>(new Map());

  useEffect(() => {
    if (plants.length === 0) return;
    const ids = plants.map(p => p.id);
    supabase
      .from('plant_images')
      .select('plant_id, image_url, is_primary, display_order')
      .in('plant_id', ids)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(5000)
      .then(({ data }) => {
        if (!data) return;
        const map = new Map<number, string[]>();
        for (const img of data) {
          const existing = map.get(img.plant_id) || [];
          existing.push(img.image_url);
          map.set(img.plant_id, existing);
        }
        setPlantImagesMap(map);
      });
  }, [plants]);
  const [selectedUsageCategories, setSelectedUsageCategories] = useState<PlantUsageCategory[]>([]);
  const [selectedPlantCategories, setSelectedPlantCategories] = useState<PlantCategory[]>([]);
  const [selectionStep, setSelectionStep] = useState<'usage' | 'category' | 'results'>('usage');
  const [selectedTile, setSelectedTile] = useState<Stone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSunExposures, setSelectedSunExposures] = useState<SunExposure[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);

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

    // White: very high RGB values AND very low saturation
    if (minVal >= 250 && maxVal >= 250 && saturation <= 5) {
      return ['white'];
    }

    // Black: very low RGB values
    if (r <= 30 && g <= 30 && b <= 30) {
      return ['black'];
    }

    // Grey: very low saturation, all RGB values similar, medium brightness
    if (saturation < 25 && brightness >= 100 && brightness <= 200) {
      return ['grey'];
    }

    // Red: R dominant, high saturation
    if (r > Math.max(g, b) + 50 && r > 140 && saturation > 50) {
      categories.push('red');
    }

    // Orange: R highest, G medium, B low
    if (r > 180 && g > 80 && g > b + 40 && r > g + 20 && b < 140) {
      categories.push('orange');
    }

    // Yellow: R and G high, B significantly lower
    if (r > 180 && g > 180 && b < Math.min(r, g) - 40) {
      categories.push('yellow');
    }

    // Gold: R and G high, B medium-low, warmer tone than yellow
    if (r > 160 && g > 120 && r > g && g > b && b > 50 && b < 150 && saturation > 40) {
      categories.push('gold');
    }

    // Green: G dominant (including light/muted greens)
    if (g > Math.max(r, b) + 20 && g > 80 && saturation > 30) {
      categories.push('green');
    }

    // Blue: B dominant, high saturation
    if (b > Math.max(r, g) + 40 && b > 140 && saturation > 50) {
      categories.push('blue');
    }

    // Purple: R and B both high, G lower
    if (r > 120 && b > 120 && g < Math.min(r, b) - 20 && Math.abs(r - b) < 60) {
      categories.push('purple');
    }

    // Pink: R high, G and B medium-high, light overall
    if (r > 180 && g > 120 && b > 120 && r > g + 20 && r > b + 20 && brightness > 150) {
      categories.push('pink');
    }

    // Brown: R dominant but not too bright, low saturation
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

  const handleColorToggle = (colorName: string) => {
    setSelectedColors(prev => {
      if (prev.includes(colorName)) {
        return prev.filter(c => c !== colorName);
      } else {
        return [...prev, colorName];
      }
    });
  };

  const clearColors = () => {
    setSelectedColors([]);
  };

  const handleUsageCategoryToggle = (category: PlantUsageCategory) => {
    setSelectedUsageCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handlePlantCategoryToggle = (category: PlantCategory) => {
    setSelectedPlantCategories(prev => {
      const next = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      if (category === 'perennial' && prev.includes('perennial')) {
        setMatrixApproach(false);
      }
      return next;
    });
  };

  const handleContinueFromUsage = () => {
    setSelectionStep('category');
  };

  const handleContinueFromCategory = () => {
    setSelectionStep('results');
    onUsageFilterChange(selectedUsageCategories);
  };

  const handleBackToUsageSelector = () => {
    setSelectionStep('usage');
  };

  const handleBackToCategorySelector = () => {
    setSelectionStep('category');
  };

  const handleTabChange = (tab: 'plants' | 'stones') => {
    setActiveTab(tab);
    if (tab === 'plants' && selectionStep === 'results') {
      // Stay on results if already completed selection
    } else if (tab === 'plants') {
      setSelectionStep('usage');
    }
  };

  const handleTileSelect = (tile: Stone) => {
    setSelectedTile(tile);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTile(null);
  };

  const handleCombinationConfirm = async (tileId: number, cobblestoneIds: number[]) => {
    await addTileCombination(tileId, cobblestoneIds);
  };

  const handleSunExposureToggle = (exposure: SunExposure) => {
    setSelectedSunExposures(prev => {
      if (prev.includes(exposure)) {
        return prev.filter(e => e !== exposure);
      } else {
        return [...prev, exposure];
      }
    });
  };

  const filteredPlants = useMemo(() => {
    let filtered = plants;

    // Filter by plant categories
    if (selectedPlantCategories.length > 0) {
      filtered = filtered.filter(plant => {
        return selectedPlantCategories.some(category => {
          if (category === 'formal_hedge') {
            return (plant as Record<string, unknown>)['usage_formal_hedge'] === true;
          }
          if (category === 'wild_hedge') {
            return (plant as Record<string, unknown>)['usage_wild_hedge'] === true;
          }
          const key = `category_${category}` as keyof Plant;
          return plant[key] === true;
        });
      });
    }

    // Filter by sun exposure
    if (selectedSunExposures.length > 0) {
      filtered = filtered.filter(plant => {
        return selectedSunExposures.some(exposure => {
          const key = `exposure_${exposure}` as keyof Plant;
          return plant[key] === true;
        });
      });
    }

    // Filter by color using the same logic as PlantsPage
    if (selectedColors.length > 0) {
      filtered = filtered.filter(plant => plantHasColor(plant, selectedColors));
    }

    return filtered;
  }, [plants, selectedPlantCategories, selectedSunExposures, selectedColors]);

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] lg:w-[600px] bg-white border-l border-gray-300 shadow-2xl z-[1002] flex flex-col">
      <div className="bg-white border-b border-gray-300 p-3 md:p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Available Plants & Stones</h2>
            <p className="text-xs md:text-sm text-gray-600 truncate">
              {cityName} - Zone {zoneCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors p-1 flex-shrink-0"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange('plants')}
            className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg font-medium transition-colors text-sm md:text-base ${
              activeTab === 'plants'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Plants</span>
            <span className="sm:hidden">Plants</span>
            <span className="px-1.5 md:px-2 py-0.5 rounded-full bg-white/30 text-xs">
              {plants.length}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('stones')}
            className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg font-medium transition-colors text-sm md:text-base ${
              activeTab === 'stones'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Mountain className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Stones</span>
            <span className="sm:hidden">Stones</span>
            <span className="px-1.5 md:px-2 py-0.5 rounded-full bg-white/30 text-xs">
              {stones.length}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'plants' && (
          <>
            {selectionStep === 'usage' ? (
              <UsageCategorySelector
                selectedCategories={selectedUsageCategories}
                onCategoryToggle={handleUsageCategoryToggle}
                onContinue={handleContinueFromUsage}
              />
            ) : selectionStep === 'category' ? (
              <PlantCategorySelector
                selectedCategories={selectedPlantCategories}
                onCategoryToggle={handlePlantCategoryToggle}

                onBack={handleBackToUsageSelector}
                onContinue={handleContinueFromCategory}
              />
            ) : (
              <div className="p-3 md:p-4">
                <div className="mb-4">
                  <button
                    onClick={handleBackToCategorySelector}
                    className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change Plant Categories
                  </button>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Usage:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsageCategories.map(category => (
                          <span
                            key={category}
                            className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium"
                          >
                            {usageCategoryLabels[category]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlantCategories.map(category => (
                          <span
                            key={category}
                            className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-medium"
                          >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="mb-4 space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  {/* Sun Exposure Filter */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="w-4 h-4 text-gray-700" />
                      <h3 className="text-sm font-semibold text-gray-900">Sun Exposure</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSunExposureToggle('sun')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          selectedSunExposures.includes('sun')
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Sun className="w-3 h-3" />
                          Full Sun
                        </div>
                      </button>
                      <button
                        onClick={() => handleSunExposureToggle('halfshade')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          selectedSunExposures.includes('halfshade')
                            ? 'bg-amber-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <CloudSun className="w-3 h-3" />
                          Part Shade
                        </div>
                      </button>
                      <button
                        onClick={() => handleSunExposureToggle('shade')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          selectedSunExposures.includes('shade')
                            ? 'bg-gray-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <CloudRain className="w-3 h-3" />
                          Shade
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Color Filter */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="w-4 h-4 text-gray-700" />
                      <h3 className="text-sm font-semibold text-gray-900">Flower/Foliage Color</h3>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Select colors</span>
                          <div className="flex items-center gap-2">
                            {selectedColors.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearColors();
                                }}
                                className="p-0.5 hover:bg-gray-100 rounded"
                              >
                                <X className="w-3 h-3 text-gray-600" />
                              </button>
                            )}
                            <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform ${isColorDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </button>

                      {isColorDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsColorDropdownOpen(false)}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                            {COLOR_OPTIONS.map((color) => (
                              <label
                                key={color.name}
                                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs text-gray-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedColors.includes(color.name)}
                                  onChange={() => handleColorToggle(color.name)}
                                  className="w-3 h-3 rounded border-gray-300 bg-white text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0"
                                />
                                <span
                                  className="w-4 h-4 ml-2 mr-2 rounded border border-gray-300"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span>{color.label}</span>
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {selectedColors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedColors.map((colorName) => {
                          const colorOption = COLOR_OPTIONS.find(c => c.name === colorName);
                          return (
                            <span
                              key={colorName}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded"
                            >
                              {colorOption && (
                                <span
                                  className="w-3 h-3 rounded border border-cyan-300"
                                  style={{ backgroundColor: colorOption.hex }}
                                />
                              )}
                              {colorOption?.label || colorName}
                              <button
                                onClick={() => handleColorToggle(colorName)}
                                className="hover:bg-cyan-200 rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {filteredPlants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Leaf className="w-16 h-16 text-gray-700 mb-4" />
                    <p className="text-gray-600 text-lg mb-2">No Plants Found</p>
                    <p className="text-gray-600 text-sm px-4">
                      {plants.length === 0
                        ? `No plants match the selected usage categories for Zone ${zoneCode}.`
                        : 'No plants match the selected filters. Try adjusting your color or sun exposure filters.'
                      }
                    </p>
                    {plants.length === 0 ? (
                      <button
                        onClick={handleBackToUsageSelector}
                        className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
                      >
                        Select Different Categories
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSunExposures([]);
                          setSelectedColors([]);
                        }}
                        className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mb-2 text-sm text-gray-600">
                      Showing {filteredPlants.length} of {plants.length} plants
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {filteredPlants.map((plant) => (
                        <PlantCard key={plant.id} plant={plant} images={plantImagesMap.get(plant.id) || (plant.image_url ? [plant.image_url] : [])} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'stones' && (
          <div className="p-3 md:p-4">
            {stones.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Mountain className="w-16 h-16 text-gray-700 mb-4" />
                <p className="text-gray-600 text-lg mb-2">No Stones Found</p>
                <p className="text-gray-600 text-sm">
                  No stones are currently available in the database for this region.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {stones.map((stone) => {
                  const isTile = stone.stone_category === 'tile' || stone.stone_category === 'both';
                  return (
                    <StoneCard
                      key={stone.id}
                      stone={stone}
                      onTileSelect={isTile ? handleTileSelect : undefined}
                      isTileMode={isTile}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && selectedTile && (
        <TileCombinationModal
          tile={selectedTile}
          onClose={handleModalClose}
          onConfirm={handleCombinationConfirm}
        />
      )}
    </div>
  );
};
