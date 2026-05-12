import React, { useState, useEffect } from 'react';
import { Loader, Plus, X, Search, Trash2 } from 'lucide-react';
import { supabase, Stone, StoneCombination, StoneCategory } from '../../lib/supabase';

interface StoneCombinationsManagerProps {
  stoneId: number;
  stoneCategory: StoneCategory;
  stoneName: string;
}

export const StoneCombinationsManager: React.FC<StoneCombinationsManagerProps> = ({
  stoneId,
  stoneCategory,
  stoneName,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [combinations, setCombinations] = useState<StoneCombination[]>([]);
  const [availableStones, setAvailableStones] = useState<Stone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStoneIds, setSelectedStoneIds] = useState<number[]>([]);

  const oppositeCategory = stoneCategory === 'tile' ? 'cobblestone' : 'tile';
  const isTile = stoneCategory === 'tile';

  useEffect(() => {
    loadData();
  }, [stoneId, stoneCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCombinations(), loadAvailableStones()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCombinations = async () => {
    try {
      const query = supabase
        .from('stone_combinations')
        .select(`
          *,
          tile_stone:stones!stone_combinations_tile_stone_id_fkey(*),
          cobblestone_stone:stones!stone_combinations_cobblestone_stone_id_fkey(*)
        `)
        .order('display_order');

      if (isTile) {
        query.eq('tile_stone_id', stoneId);
      } else {
        query.eq('cobblestone_stone_id', stoneId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCombinations(data || []);
    } catch (error) {
      console.error('Error loading combinations:', error);
    }
  };

  const loadAvailableStones = async () => {
    try {
      const { data, error } = await supabase
        .from('stones')
        .select('*')
        .eq('stone_category', oppositeCategory)
        .order('name');

      if (error) throw error;
      setAvailableStones(data || []);
    } catch (error) {
      console.error('Error loading available stones:', error);
    }
  };

  const getAssociatedStones = (): Stone[] => {
    return combinations
      .map((combo) => (isTile ? combo.cobblestone_stone : combo.tile_stone))
      .filter((stone): stone is Stone => stone !== null);
  };

  const getFilteredAvailableStones = (): Stone[] => {
    const associatedIds = new Set(
      combinations.map((combo) =>
        isTile ? combo.cobblestone_stone_id : combo.tile_stone_id
      )
    );

    return availableStones
      .filter((stone) => !associatedIds.has(stone.id))
      .filter(
        (stone) =>
          searchQuery === '' ||
          stone.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  const handleAddCombinations = async () => {
    if (selectedStoneIds.length === 0) return;

    setSaving(true);
    try {
      const maxOrder =
        combinations.length > 0
          ? Math.max(...combinations.map((c) => c.display_order))
          : -1;

      const newCombinations = selectedStoneIds.map((oppositeStoneId, index) => ({
        tile_stone_id: isTile ? stoneId : oppositeStoneId,
        cobblestone_stone_id: isTile ? oppositeStoneId : stoneId,
        display_order: maxOrder + index + 1,
      }));

      const { error } = await supabase
        .from('stone_combinations')
        .insert(newCombinations);

      if (error) throw error;

      setSelectedStoneIds([]);
      setShowAddDialog(false);
      setSearchQuery('');
      await loadCombinations();
    } catch (error: any) {
      console.error('Error adding combinations:', error);
      alert(`Failed to add combinations: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCombination = async (combinationId: string) => {
    if (!confirm('Are you sure you want to remove this combination?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('stone_combinations')
        .delete()
        .eq('id', combinationId);

      if (error) throw error;

      await loadCombinations();
    } catch (error: any) {
      console.error('Error removing combination:', error);
      alert(`Failed to remove combination: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleStoneSelection = (stoneId: number) => {
    setSelectedStoneIds((prev) =>
      prev.includes(stoneId)
        ? prev.filter((id) => id !== stoneId)
        : [...prev, stoneId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const associatedStones = getAssociatedStones();
  const filteredAvailableStones = getFilteredAvailableStones();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">
            {isTile ? 'Compatible Cobblestones' : 'Compatible Tiles'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {associatedStones.length === 0
              ? `No ${oppositeCategory}s associated yet`
              : `${associatedStones.length} ${oppositeCategory}${
                  associatedStones.length === 1 ? '' : 's'
                } associated`}
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add {oppositeCategory === 'tile' ? 'Tiles' : 'Cobblestones'}
        </button>
      </div>

      {associatedStones.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {associatedStones.map((stone, index) => {
            const combination = combinations[index];
            return (
              <div
                key={stone.id}
                className="relative border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <button
                  onClick={() => handleRemoveCombination(combination.id)}
                  disabled={saving}
                  className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                  title="Remove combination"
                >
                  <X className="w-4 h-4" />
                </button>

                {stone.image_url && (
                  <div className="mb-3">
                    <img
                      src={stone.image_url}
                      alt={stone.name}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}

                <h4 className="font-medium text-gray-900 pr-8">{stone.name}</h4>
                {stone.stone_color && (
                  <p className="text-sm text-gray-600 mt-1">{stone.stone_color}</p>
                )}
                {stone.origin && (
                  <p className="text-sm text-gray-500 mt-1">{stone.origin}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Add {oppositeCategory === 'tile' ? 'Tiles' : 'Cobblestones'}
              </h3>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setSelectedStoneIds([]);
                  setSearchQuery('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${oppositeCategory}s...`}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {selectedStoneIds.length > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  {selectedStoneIds.length} {oppositeCategory}
                  {selectedStoneIds.length === 1 ? '' : 's'} selected
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredAvailableStones.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchQuery
                      ? `No ${oppositeCategory}s found matching "${searchQuery}"`
                      : `No available ${oppositeCategory}s to add`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAvailableStones.map((stone) => {
                    const isSelected = selectedStoneIds.includes(stone.id);
                    return (
                      <div
                        key={stone.id}
                        onClick={() => toggleStoneSelection(stone.id)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            {stone.image_url && (
                              <div className="mb-2">
                                <img
                                  src={stone.image_url}
                                  alt={stone.name}
                                  className="w-full h-24 object-cover rounded"
                                />
                              </div>
                            )}
                            <h4 className="font-medium text-gray-900">{stone.name}</h4>
                            {stone.stone_color && (
                              <p className="text-sm text-gray-600 mt-1">
                                {stone.stone_color}
                              </p>
                            )}
                            {stone.origin && (
                              <p className="text-sm text-gray-500 mt-1">{stone.origin}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setSelectedStoneIds([]);
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCombinations}
                disabled={saving || selectedStoneIds.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Selected
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
