import React, { useState } from 'react';
import { Plant } from '../../lib/supabase';
import { useSelections } from '../../contexts/SelectionsContext';
import { Check, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { ColorTimeline } from '../ColorTimeline';

interface PlantCardProps {
  plant: Plant;
  images?: string[];
}

const DEFAULT_IMAGE = 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=600';

export const PlantCard: React.FC<PlantCardProps> = ({ plant, images = [] }) => {
  const { isPlantSelected, addPlantSelection, removeSelection, selections } = useSelections();
  const selected = isPlantSelected(plant.id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(new Set());

  const allImages = images.length > 0 ? images : (plant.image_url ? [plant.image_url] : [DEFAULT_IMAGE]);
  const validImages = allImages.filter((_, i) => !failedIndexes.has(i));
  const hasMultiple = validImages.length > 1;

  const handleImageError = (index: number) => {
    setFailedIndexes(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    // Advance to next non-failed image
    setCurrentIndex(prev => {
      if (prev !== index) return prev;
      const nextIndex = allImages.findIndex((_, i) => i > index && !failedIndexes.has(i));
      if (nextIndex !== -1) return nextIndex;
      const prevIndex = allImages.findIndex((_, i) => i < index && !failedIndexes.has(i));
      return prevIndex !== -1 ? prevIndex : prev;
    });
  };

  const handleToggleSelection = async () => {
    if (selected) {
      const selection = selections.find(s => s.plant_id === plant.id);
      if (selection) await removeSelection(selection.id);
    } else {
      await addPlantSelection(plant.id);
    }
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const pos = validImages.indexOf(allImages[currentIndex]);
    const prevUrl = validImages[(pos - 1 + validImages.length) % validImages.length];
    setCurrentIndex(allImages.indexOf(prevUrl));
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    const pos = validImages.indexOf(allImages[currentIndex]);
    const nextUrl = validImages[(pos + 1) % validImages.length];
    setCurrentIndex(allImages.indexOf(nextUrl));
  };

  const getClimateZones = (): string[] => {
    const zones: string[] = [];
    if (plant.zone_2a) zones.push('2a');
    if (plant.zone_2b) zones.push('2b');
    if (plant.zone_3a) zones.push('3a');
    if (plant.zone_3b) zones.push('3b');
    if (plant.zone_4a) zones.push('4a');
    if (plant.zone_4b) zones.push('4b');
    if (plant.zone_5a) zones.push('5a');
    if (plant.zone_5b) zones.push('5b');
    if (plant.zone_6a) zones.push('6a');
    if (plant.zone_6b) zones.push('6b');
    if (plant.zone_7a) zones.push('7a');
    if (plant.zone_7b) zones.push('7b');
    if (plant.zone_8a) zones.push('8a');
    if (plant.zone_8b) zones.push('8b');
    if (plant.zone_9a) zones.push('9a');
    if (plant.zone_9b) zones.push('9b');
    if (plant.zone_10a) zones.push('10a');
    if (plant.zone_10b) zones.push('10b');
    return zones;
  };

  const getLayerStyle = (layer: string | null): React.CSSProperties => {
    if (!layer) return {};
    switch (layer) {
      case 'Structural':   return { backgroundColor: '#e79880', color: '#fff', borderColor: '#e79880' };
      case 'Companion':    return { backgroundColor: '#9cdcf9', color: '#fff', borderColor: '#9cdcf9' };
      case 'Ground Cover': return { backgroundColor: '#acd3a2', color: '#fff', borderColor: '#acd3a2' };
      case 'Free Floaters':return { backgroundColor: '#f5a6c8', color: '#fff', borderColor: '#f5a6c8' };
      default:             return { backgroundColor: '#e5e7eb', color: '#374151', borderColor: '#d1d5db' };
    }
  };

  const climateZones = getClimateZones();

  return (
    <div className="bg-white border border-gray-300 rounded-lg hover:border-cyan-500 transition-colors overflow-hidden shadow-sm">
      <div className="relative h-80 bg-gray-100 group">
        {allImages.map((url, index) => (
          !failedIndexes.has(index) && (
            <img
              key={url}
              src={url}
              alt={plant.botanical_name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              loading="lazy"
              decoding="async"
              onError={() => handleImageError(index)}
            />
          )
        ))}
        {validImages.length === 0 && (
          <img src={DEFAULT_IMAGE} alt={plant.botanical_name} className="absolute inset-0 w-full h-full object-cover" />
        )}

        {hasMultiple && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-800"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {validImages.map((url, dotPos) => (
                <div
                  key={url}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${allImages.indexOf(url) === currentIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </>
        )}

        <button
          onClick={handleToggleSelection}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            selected
              ? 'bg-cyan-600 text-white'
              : 'bg-white/90 text-gray-700 hover:bg-white border border-gray-300'
          }`}
          title={selected ? 'Remove from selection' : 'Add to selection'}
        >
          {selected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{plant.botanical_name}</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {plant.layer && (
              <span
                className="inline-block px-2 py-1 rounded text-xs font-medium border"
                style={getLayerStyle(plant.layer)}
              >
                {plant.layer}
              </span>
            )}
            {climateZones.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {climateZones.map((zone) => (
                  <span
                    key={zone}
                    className="inline-block bg-gray-100 px-2 py-1 rounded text-xs font-semibold text-gray-700"
                  >
                    {zone}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <ColorTimeline
            colors={{
              jan: plant.color_jan,
              feb: plant.color_feb,
              mar: plant.color_mar,
              apr: plant.color_apr,
              may: plant.color_may,
              jun: plant.color_jun,
              jul: plant.color_jul,
              aug: plant.color_aug,
              sep: plant.color_sep,
              oct: plant.color_oct,
              nov: plant.color_nov,
              dec: plant.color_dec,
            }}
            colors2={{
              jan: plant.color2_jan,
              feb: plant.color2_feb,
              mar: plant.color2_mar,
              apr: plant.color2_apr,
              may: plant.color2_may,
              jun: plant.color2_jun,
              jul: plant.color2_jul,
              aug: plant.color2_aug,
              sep: plant.color2_sep,
              oct: plant.color2_oct,
              nov: plant.color2_nov,
              dec: plant.color2_dec,
            }}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};
