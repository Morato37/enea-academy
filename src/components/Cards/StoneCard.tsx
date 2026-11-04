import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stone, optimizeImageUrl } from '../../lib/supabase';
import { useSelections } from '../../contexts/SelectionsContext';
import { Check, Plus, Eye } from 'lucide-react';

interface StoneCardProps {
  stone: Stone;
  onTileSelect?: (tile: Stone) => void;
  isTileMode?: boolean;
}

export const StoneCard: React.FC<StoneCardProps> = ({ stone, onTileSelect, isTileMode }) => {
  const navigate = useNavigate();
  const { isStoneSelected, addStoneSelection, removeSelection, selections } = useSelections();
  const selected = isStoneSelected(stone.id);

  const handleToggleSelection = async () => {
    if (selected) {
      const selection = selections.find(s => s.stone_id === stone.id);
      if (selection) {
        await removeSelection(selection.id);
      }
    } else {
      await addStoneSelection(stone.id);
    }
  };

  const getClimateZones = (): string[] => {
    const zones: string[] = [];
    if (stone.mediterranean_zone) zones.push('Mediterranean');
    if (stone.central_europe_zone) zones.push('Central Europe');
    if (stone.alpine_zone) zones.push('Alpine');
    return zones;
  };

  const getApplications = (): string[] => {
    const apps: string[] = [];
    if (stone.use_tiles) apps.push('Tiles');
    if (stone.use_block_steps) apps.push('Block Steps');
    if (stone.use_paving) apps.push('Paving');
    if (stone.use_walls) apps.push('Walls');
    if (stone.use_pool) apps.push('Pool');
    if (stone.use_chippings) apps.push('Chippings');
    return apps;
  };

  const getFinishes = (): string[] => {
    const finishes: string[] = [];
    if (stone.finish_split) finishes.push('Split');
    if (stone.finish_flamed) finishes.push('Flamed');
    if (stone.finish_flamed_wild) finishes.push('Flamed Wild');
    if (stone.finish_split_antique_wild) finishes.push('Split Antique Wild');
    if (stone.finish_blasted) finishes.push('Blasted');
    if (stone.finish_sawn) finishes.push('Sawn');
    if (stone.finish_hammered) finishes.push('Hammered');
    if (stone.finish_brushed) finishes.push('Brushed');
    if (stone.finish_polished) finishes.push('Polished');
    if (stone.finish_honed) finishes.push('Honed');
    return finishes;
  };

  const getFrostResistance = (): string | null => {
    if (stone.frost_resistant) return 'Frost Resistant';
    if (stone.less_frost_resistant) return 'Less Frost Resistant';
    if (stone.not_frost_resistant) return 'Not Frost Resistant';
    return null;
  };

  const defaultImageUrl = 'https://images.pexels.com/photos/417070/pexels-photo-417070.jpeg?auto=compress&cs=tinysrgb&w=600';
  const imageUrl = optimizeImageUrl(stone.image_url, { width: 400, quality: 70 }) || defaultImageUrl;

  const _climateZones = getClimateZones();
  const _applications = getApplications();
  const _finishes = getFinishes();
  const _frostResistance = getFrostResistance();
  void _climateZones; void _applications; void _finishes; void _frostResistance;


  return (
    <div className="bg-white border border-gray-300 rounded-lg hover:border-cyan-500 transition-colors overflow-hidden shadow-sm">
      <div className="relative h-80 bg-gray-100">
        <img
          src={imageUrl}
          alt={stone.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = defaultImageUrl;
          }}
        />
        {isTileMode && onTileSelect ? (
          <button
            onClick={() => onTileSelect(stone)}
            className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-cyan-600 text-white hover:bg-cyan-700"
            title="Select cobblestones for this tile"
          >
            <Plus className="w-5 h-5" />
          </button>
        ) : (
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
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 break-words leading-snug min-w-0">
            {stone.name}
          </h3>
          {stone.stone_category && (
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
              stone.stone_category === 'tile'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {stone.stone_category === 'tile' ? 'Tile' : 'Cobblestone'}
            </span>
          )}
        </div>

        {stone.stone_color && (
          <div className="mt-3">
            <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm border border-gray-200">
              {stone.stone_color}
            </span>
          </div>
        )}

        <button
          onClick={() => navigate(`/stone/${stone.id}`)}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
      </div>
    </div>
  );
};
