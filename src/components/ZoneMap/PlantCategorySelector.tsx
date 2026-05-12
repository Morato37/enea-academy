import React from 'react';
import { TreePine, Trees, Flower, Sprout, Wind, Sun, Droplet, Mountain, Fence } from 'lucide-react';

export type PlantCategory =
  | 'shrub'
  | 'tree'
  | 'palm'
  | 'perennial'
  | 'annual'
  | 'grass'
  | 'succulent'
  | 'bulb'
  | 'acquatic'
  | 'formal_hedge'
  | 'wild_hedge';

interface PlantCategorySelectorProps {
  selectedCategories: PlantCategory[];
  onCategoryToggle: (category: PlantCategory) => void;
  onBack: () => void;
  onContinue: () => void;
}

interface CategoryOption {
  id: PlantCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const categoryOptions: CategoryOption[] = [
  {
    id: 'tree',
    label: 'Trees',
    icon: Trees,
    description: 'Woody plants with a single main stem',
  },
  {
    id: 'shrub',
    label: 'Shrubs',
    icon: TreePine,
    description: 'Woody plants with multiple stems',
  },
  {
    id: 'perennial',
    label: 'Perennials',
    icon: Flower,
    description: 'Plants that live for multiple years',
  },
  {
    id: 'annual',
    label: 'Annuals',
    icon: Sun,
    description: 'Plants that complete lifecycle in one year',
  },
  {
    id: 'grass',
    label: 'Grasses',
    icon: Wind,
    description: 'Grass-like plants and ornamental grasses',
  },
  {
    id: 'palm',
    label: 'Palms',
    icon: Trees,
    description: 'Palm trees and palm-like plants',
  },
  {
    id: 'bulb',
    label: 'Bulbs',
    icon: Sprout,
    description: 'Bulbous and tuberous plants',
  },
  {
    id: 'succulent',
    label: 'Succulents',
    icon: Mountain,
    description: 'Water-storing drought-resistant plants',
  },
  {
    id: 'acquatic',
    label: 'Aquatic',
    icon: Droplet,
    description: 'Water plants and pond plants',
  },
  {
    id: 'formal_hedge',
    label: 'Formal Hedge',
    icon: Fence,
    description: 'Formal hedging plants',
  },
  {
    id: 'wild_hedge',
    label: 'Wild Hedge',
    icon: Flower,
    description: 'Natural, informal hedges',
  },
];

export const PlantCategorySelector: React.FC<PlantCategorySelectorProps> = ({
  selectedCategories,
  onCategoryToggle,
  onBack,
  onContinue,
}) => {
  const hasSelection = selectedCategories.length > 0;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Select Plant Categories</h3>
          <p className="text-sm text-gray-600">
            Choose one or more plant types to refine your search
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categoryOptions.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategories.includes(category.id);

            return (
              <button
                key={category.id}
                onClick={() => onCategoryToggle(category.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'bg-cyan-600 border-cyan-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-cyan-500/50 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-cyan-600'}`} />
                <div className="text-center">
                  <div className="font-semibold text-sm mb-0.5">{category.label}</div>
                  <div className={`text-xs ${isSelected ? 'text-cyan-100' : 'text-gray-600'}`}>
                    {category.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      <div className="border-t border-gray-300 p-4 bg-white space-y-2">
        <button
          onClick={onContinue}
          disabled={!hasSelection}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            hasSelection
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          {hasSelection
            ? `Show Plants (${selectedCategories.length} ${selectedCategories.length === 1 ? 'type' : 'types'})`
            : 'Select at least one category'}
        </button>
        <button
          onClick={onBack}
          className="w-full py-2 px-4 rounded-lg font-medium transition-all bg-gray-200 hover:bg-gray-300 text-gray-700"
        >
          Back to Usage Selection
        </button>
      </div>
    </div>
  );
};
