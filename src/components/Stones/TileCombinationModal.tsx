import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Stone, StoneCombination, supabase } from '../../lib/supabase';

interface TileCombinationModalProps {
  tile: Stone;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tileId: number, cobblestoneIds: number[]) => Promise<void>;
}

export const TileCombinationModal: React.FC<TileCombinationModalProps> = ({
  tile,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [combinations, setCombinations] = useState<StoneCombination[]>([]);
  const [availableCobblestones, setAvailableCobblestones] = useState<Stone[]>([]);
  const [selectedCobblestones, setSelectedCobblestones] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && tile) {
      fetchCombinations();
    }
  }, [isOpen, tile]);

  const fetchCombinations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stone_combinations')
        .select(`
          *,
          cobblestone_stone:stones!stone_combinations_cobblestone_stone_id_fkey(*)
        `)
        .eq('tile_stone_id', tile.id)
        .order('display_order');

      if (error) throw error;

      setCombinations(data || []);
      const cobblestones = (data || [])
        .map((combo) => combo.cobblestone_stone)
        .filter((stone): stone is Stone => stone !== null);
      setAvailableCobblestones(cobblestones);
    } catch (error) {
      console.error('Error fetching combinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCobblestone = (cobblestoneId: number) => {
    setSelectedCobblestones((prev) =>
      prev.includes(cobblestoneId)
        ? prev.filter((id) => id !== cobblestoneId)
        : [...prev, cobblestoneId]
    );
  };

  const handleConfirm = async () => {
    if (selectedCobblestones.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(tile.id, selectedCobblestones);
      setSelectedCobblestones([]);
      onClose();
    } catch (error) {
      console.error('Error confirming selection:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedCobblestones([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Select Cobblestones</h2>
            <p className="text-gray-400 mt-1">
              Choose cobblestones to combine with <span className="text-blue-400">{tile.name}</span>
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : availableCobblestones.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                No cobblestones available for this tile.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCobblestones.map((cobblestone) => {
                const isSelected = selectedCobblestones.includes(cobblestone.id);
                const defaultImageUrl = 'https://images.pexels.com/photos/417070/pexels-photo-417070.jpeg?auto=compress&cs=tinysrgb&w=600';

                return (
                  <div
                    key={cobblestone.id}
                    onClick={() => toggleCobblestone(cobblestone.id)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                      isSelected
                        ? 'ring-4 ring-green-600 shadow-lg shadow-green-600/50'
                        : 'ring-2 ring-zinc-700 hover:ring-zinc-600'
                    }`}
                  >
                    <div className="relative h-48 bg-zinc-950">
                      <img
                        src={cobblestone.image_url || defaultImageUrl}
                        alt={cobblestone.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = defaultImageUrl;
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-green-600 bg-opacity-40 flex items-center justify-center">
                          <div className="bg-green-600 rounded-full p-2">
                            <Check className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-zinc-800 p-3">
                      <h3 className="text-white font-semibold">{cobblestone.name}</h3>
                      {cobblestone.morphology && (
                        <p className="text-sm text-gray-400 mt-1">{cobblestone.morphology}</p>
                      )}
                      {cobblestone.stone_color && (
                        <p className="text-xs text-gray-500 mt-1">Color: {cobblestone.stone_color}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              {selectedCobblestones.length > 0 ? (
                <span>
                  <span className="text-green-400 font-semibold">
                    {selectedCobblestones.length}
                  </span>{' '}
                  cobblestone{selectedCobblestones.length !== 1 ? 's' : ''} selected
                </span>
              ) : (
                <span>Select at least one cobblestone to continue</span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCobblestones.length === 0 || submitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-zinc-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? 'Adding...' : 'Add to Selection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
