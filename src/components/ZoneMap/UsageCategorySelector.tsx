import React from 'react';
import { TreePine, Trees, Sprout, Check } from 'lucide-react';

export type PlantUsageCategory =
  | 'solitary_garden'
  | 'solitary_park'
  | 'solitary_terrace';

interface UsageCategorySelectorProps {
  selectedCategories: PlantUsageCategory[];
  onCategoryToggle: (category: PlantUsageCategory) => void;
  onContinue: () => void;
}

interface CategoryOption {
  id: PlantUsageCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const usageCategoryLabels: Record<PlantUsageCategory, string> = {
  solitary_garden: 'Private Garden',
  solitary_park: 'Private Park',
  solitary_terrace: 'Private Terrace',
};

const categoryOptions: CategoryOption[] = [
  {
    id: 'solitary_garden',
    label: 'Private Garden',
    icon: TreePine,
    description: 'Trees suitable for garden spaces',
  },
  {
    id: 'solitary_park',
    label: 'Private Park',
    icon: Trees,
    description: 'Trees for parks and large spaces',
  },
  {
    id: 'solitary_terrace',
    label: 'Private Terrace',
    icon: Sprout,
    description: 'Trees for terraces and patios',
  },
];

export const UsageCategorySelector: React.FC<UsageCategorySelectorProps> = ({
  selectedCategories,
  onCategoryToggle,
  onContinue,
}) => {
  const hasSelection = selectedCategories.length > 0;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#add8e6' }}>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Select Plant Usage</h3>
          <p className="text-sm text-gray-700">
            Choose one or more categories to see suitable plants for your needs
          </p>
        </div>

        <div className="space-y-3">
          {categoryOptions.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategories.includes(category.id as PlantUsageCategory);

            return (
              <button
                key={category.id}
                onClick={() => onCategoryToggle(category.id as PlantUsageCategory)}
                className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-emerald-500/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1">{category.label}</div>
                  <div className={`text-xs ${isSelected ? 'text-emerald-100' : 'text-gray-600'}`}>
                    {category.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-300 p-4" style={{ backgroundColor: '#9ac9db' }}>
        <button
          onClick={onContinue}
          disabled={!hasSelection}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            hasSelection
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          {hasSelection
            ? `Show Plants (${selectedCategories.length} ${selectedCategories.length === 1 ? 'category' : 'categories'})`
            : 'Select at least one category'}
        </button>
      </div>
    </div>
  );
};
