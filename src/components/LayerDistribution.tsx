import React, { useState, useEffect } from 'react';
import { useSelections } from '../contexts/SelectionsContext';
import { supabase } from '../lib/supabase';
import { ChevronDown } from 'lucide-react';

interface PlantInLayer {
  id: number;
  botanical_name: string;
}

interface LayerStats {
  layer: string;
  count: number;
  percentage: number;
  recommended: string;
  color: string;
  plants: PlantInLayer[];
}

export const LayerDistribution: React.FC = () => {
  const { selections } = useSelections();
  const [layerStats, setLayerStats] = useState<LayerStats[]>([]);
  const [totalWithLayers, setTotalWithLayers] = useState(0);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    calculateLayerDistribution();
  }, [selections]);

  const calculateLayerDistribution = async () => {
    const plantSelections = selections.filter(s => s.plant_id);

    if (plantSelections.length === 0) {
      setLayerStats([]);
      setTotalWithLayers(0);
      return;
    }

    try {
      const plantIds = plantSelections.map(s => s.plant_id);
      const { data: plants, error } = await supabase
        .from('plants_flat')
        .select('id, layer, botanical_name')
        .in('id', plantIds);

      if (error) throw error;

      const plantsWithLayers = plants?.filter(p => p.layer) || [];
      const total = plantsWithLayers.length;

      if (total === 0) {
        setLayerStats([]);
        setTotalWithLayers(0);
        return;
      }

      setTotalWithLayers(total);

      const layerGroups: { [key: string]: PlantInLayer[] } = {
        'Structural': [],
        'Companion': [],
        'Ground Cover': [],
        'Free Floaters': [],
      };

      plantsWithLayers.forEach(plant => {
        if (plant.layer && layerGroups.hasOwnProperty(plant.layer)) {
          layerGroups[plant.layer].push({
            id: plant.id,
            botanical_name: plant.botanical_name
          });
        }
      });

      const stats: LayerStats[] = [
        {
          layer: 'Structural',
          count: layerGroups['Structural'].length,
          percentage: (layerGroups['Structural'].length / total) * 100,
          recommended: '10-15%',
          color: '#e79880',
          plants: layerGroups['Structural'],
        },
        {
          layer: 'Companion',
          count: layerGroups['Companion'].length,
          percentage: (layerGroups['Companion'].length / total) * 100,
          recommended: '25-40%',
          color: '#9cdcf9',
          plants: layerGroups['Companion'],
        },
        {
          layer: 'Ground Cover',
          count: layerGroups['Ground Cover'].length,
          percentage: (layerGroups['Ground Cover'].length / total) * 100,
          recommended: '50%',
          color: '#acd3a2',
          plants: layerGroups['Ground Cover'],
        },
        {
          layer: 'Free Floaters',
          count: layerGroups['Free Floaters'].length,
          percentage: (layerGroups['Free Floaters'].length / total) * 100,
          recommended: '10%',
          color: '#f5a6c8',
          plants: layerGroups['Free Floaters'],
        },
      ];

      setLayerStats(stats);
    } catch (error) {
      console.error('Error calculating layer distribution:', error);
    }
  };

  const toggleLayer = (layer: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layer)) {
      newExpanded.delete(layer);
    } else {
      newExpanded.add(layer);
    }
    setExpandedLayers(newExpanded);
  };

  if (totalWithLayers === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Layer Distribution</h3>
      <p className="text-sm text-gray-600 mb-4">
        {totalWithLayers} plant{totalWithLayers !== 1 ? 's' : ''} with layers selected
      </p>

      <div className="space-y-4">
        {layerStats.map((stat) => (
          <div key={stat.layer}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{stat.layer}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {stat.count} ({stat.percentage.toFixed(1)}%)
                </span>
                <span className="text-xs text-gray-500">
                  Target: {stat.recommended}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(stat.percentage, 100)}%`,
                  backgroundColor: stat.color
                }}
              />
            </div>

            {stat.count > 0 && (
              <>
                <button
                  onClick={() => toggleLayer(stat.layer)}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${expandedLayers.has(stat.layer) ? 'rotate-180' : ''}`}
                  />
                  {expandedLayers.has(stat.layer) ? 'Hide' : 'Show'} plants
                </button>

                {expandedLayers.has(stat.layer) && (
                  <div className="mt-2 pl-4 space-y-1">
                    {stat.plants.map((plant) => (
                      <div
                        key={plant.id}
                        className="text-xs text-gray-700 italic"
                      >
                        • {plant.botanical_name}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Recommended distribution for optimal planting design
        </p>
      </div>
    </div>
  );
};
