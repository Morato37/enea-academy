import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface StoneFilterState {
  search: string;
  regions: string[];
  stoneTypes: string[];
  applications: string[];
  colors: string[];
  categories: string[];
}

interface StoneFiltersProps {
  filters: StoneFilterState;
  onFilterChange: (filters: StoneFilterState) => void;
}

const REGION_GROUPS = [
  { id: 'alpine', name: 'Alpine', zones: ['5a', '5b', '6a', '6b'], color: 'bg-blue-50 border-blue-200' },
  { id: 'central_european', name: 'Central european', zones: ['7a', '7b', '8a', '8b'], color: 'bg-amber-50 border-amber-200' },
  { id: 'mediterranean', name: 'Mediterranean', zones: ['9a', '9b', '10a', '10b'], color: 'bg-rose-50 border-rose-200' },
];

const STONE_TYPES = ['Sandstone', 'Limestone', 'Granite', 'Basalt', 'Slate', 'Quartzite', 'Gneiss'];
const APPLICATIONS = ['tiles', 'block_steps', 'paving', 'walls', 'pool', 'chippings'];
const COLORS = ['grey', 'light-grey', 'anthrazite', 'beige', 'grey-brown', 'silver-grey', 'black', 'white'];
const CATEGORIES = ['tile', 'cobblestone'];

const formatLabel = (value: string): string => {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Choose an option'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onChange(newValues);
  };

  const removeTag = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== option));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{placeholder}</span>
            <div className="flex items-center gap-2">
              {selectedValues.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-0.5 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="w-4 h-4 rounded border-gray-300 bg-white text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0"
                  />
                  <span className="ml-2">{formatLabel(option)}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedValues.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded"
            >
              {formatLabel(value)}
              <button
                onClick={(e) => removeTag(value, e)}
                className="hover:bg-cyan-200 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface RegionSelectorProps {
  selectedRegions: string[];
  onChange: (regions: string[]) => void;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({ selectedRegions, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleRegion = (regionId: string) => {
    const newRegions = selectedRegions.includes(regionId)
      ? selectedRegions.filter(r => r !== regionId)
      : [...selectedRegions, regionId];
    onChange(newRegions);
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const removeTag = (regionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedRegions.filter(r => r !== regionId));
  };

  const getRegionData = (regionId: string) => {
    return REGION_GROUPS.find(r => r.id === regionId);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Region
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Choose regions</span>
            <div className="flex items-center gap-2">
              {selectedRegions.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-0.5 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-80 overflow-auto">
              {REGION_GROUPS.map((region) => (
                <label
                  key={region.id}
                  className={`flex items-center px-3 py-3 hover:bg-opacity-75 cursor-pointer text-sm text-gray-700 border-b last:border-b-0 ${region.color}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRegions.includes(region.id)}
                    onChange={() => toggleRegion(region.id)}
                    className="w-4 h-4 rounded border-gray-300 bg-white text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 flex-shrink-0"
                  />
                  <div className="ml-2 flex flex-col">
                    <span className="font-medium">{region.name}</span>
                    <span className="text-xs text-gray-600">Zones: {region.zones.join(', ').toUpperCase()}</span>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedRegions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedRegions.map((regionId) => {
            const region = getRegionData(regionId);
            return region ? (
              <span
                key={regionId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded"
              >
                {region.name} ({region.zones.join(', ').toUpperCase()})
                <button
                  onClick={(e) => removeTag(regionId, e)}
                  className="hover:bg-cyan-200 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

export const StoneFilters: React.FC<StoneFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Stone Filters</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search by Name
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
          placeholder="Search..."
        />
      </div>

      <MultiSelectDropdown
        label="Category"
        options={CATEGORIES}
        selectedValues={filters.categories}
        onChange={(values) => onFilterChange({ ...filters, categories: values })}
      />

      <MultiSelectDropdown
        label="Stone Type"
        options={STONE_TYPES}
        selectedValues={filters.stoneTypes}
        onChange={(values) => onFilterChange({ ...filters, stoneTypes: values })}
      />

      <MultiSelectDropdown
        label="Application"
        options={APPLICATIONS}
        selectedValues={filters.applications}
        onChange={(values) => onFilterChange({ ...filters, applications: values })}
      />

      <MultiSelectDropdown
        label="Color"
        options={COLORS}
        selectedValues={filters.colors}
        onChange={(values) => onFilterChange({ ...filters, colors: values })}
      />

      <RegionSelector
        selectedRegions={filters.regions}
        onChange={(regions) => onFilterChange({ ...filters, regions })}
      />
    </div>
  );
};
