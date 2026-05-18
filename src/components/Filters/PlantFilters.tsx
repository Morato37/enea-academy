import React, { useState } from 'react';
import { ChevronDown, X, Info } from 'lucide-react';

export interface PlantFilterState {
  search: string;
  climateZones: string[];
  plantTypes: string[];
  sunRequirements: string[];
  usageCategories: string[];
  layers: string[];
  sizes: string[];
  colors: string[];
  biodiversity: string[];
  nativeStatus: string[];
  leafPersistence: string[];
  treeOfTheFuture: boolean;
  naturalisticPlantingDesign: boolean;
}

interface PlantFiltersProps {
  filters: PlantFilterState;
  onFilterChange: (filters: PlantFilterState) => void;
}

const CLIMATE_ZONE_GROUPS = {
  alpine: { name: 'Alpine', zones: ['5a', '5b', '6a', '6b'], color: 'bg-blue-50 border-blue-200' },
  central_european: { name: 'Central european', zones: ['7a', '7b', '8a', '8b'], color: 'bg-amber-50 border-amber-200' },
  mediterranean: { name: 'Mediterranean', zones: ['9a', '9b', '10a', '10b'], color: 'bg-rose-50 border-rose-200' },
};

const PLANT_TYPES = ['tree', 'shrub', 'perennial', 'grass', 'bulb', 'acquatic', 'medicinal_herbs'];
const SUN_REQUIREMENTS = ['sun', 'halfshade', 'shade'];
const LAYERS = ['Structural', 'Companion', 'Ground Cover', 'Free Floaters'];
const PLANT_SIZES = ['short', 'medium', 'tall'];
const COLORS = ['white', 'yellow', 'gold', 'orange', 'red', 'pink', 'purple', 'blue', 'green', 'brown', 'grey', 'black'];
const BIODIVERSITY_OPTIONS = ['butterflies', 'bees', 'honeybees', 'bumblebees', 'hoverflies', 'beetles', 'birds'];
const NATIVE_STATUS_OPTIONS = ['ch_native'];
const LEAF_PERSISTENCE_OPTIONS = ['evergreen', 'deciduous'];
const USAGE_CATEGORIES = [
  'solitary_garden',
  'solitary_park',
  'solitary_terrace',
  'formal_hedge',
  'wild_hedge',
];

const formatLabel = (value: string): string => {
  if (value.match(/^\d+[ab]$/)) return `Zone ${value.toUpperCase()}`;

  // Format plant size labels with dimensions
  if (value === 'short') return 'Short (5-40 cm)';
  if (value === 'medium') return 'Medium (40-80 cm)';
  if (value === 'tall') return 'Tall (80-200 cm)';

  // Replace "Solitary" with "Private" for usage categories
  if (value.startsWith('solitary_')) {
    return value
      .replace('solitary', 'private')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Special formatting for specific categories
  if (value === 'tree') return 'Trees';
  if (value === 'shrub') return 'Shrubs';
  if (value === 'perennial') return 'Perennials';
  if (value === 'grass') return 'Grasses';
  if (value === 'bulb') return 'Bulbs';
  if (value === 'acquatic') return 'Aquatic Plants';
  if (value === 'medicinal_herbs') return 'Medicinal Herbs';
  if (value === 'ch_native') return 'CH Native';

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
  tooltip?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Choose an option',
  tooltip
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

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
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
        {label}
        {tooltip && (
          <div className="relative inline-block">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
            {showTooltip && (
              <div className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-normal w-56 z-[9999]">
                {tooltip}
                <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        )}
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

interface ClimateZoneSelectorProps {
  selectedZones: string[];
  onChange: (zones: string[]) => void;
}

const ClimateZoneSelector: React.FC<ClimateZoneSelectorProps> = ({ selectedZones, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getSelectedRegions = () => {
    return Object.entries(CLIMATE_ZONE_GROUPS)
      .filter(([_, group]) => group.zones.every(z => selectedZones.includes(z)))
      .map(([key]) => key);
  };

  const toggleRegion = (regionKey: string) => {
    const group = CLIMATE_ZONE_GROUPS[regionKey as keyof typeof CLIMATE_ZONE_GROUPS];
    const allSelected = group.zones.every(z => selectedZones.includes(z));

    if (allSelected) {
      onChange(selectedZones.filter(z => !group.zones.includes(z)));
    } else {
      const newZones = [...new Set([...selectedZones, ...group.zones])];
      onChange(newZones);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const removeRegion = (regionKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const group = CLIMATE_ZONE_GROUPS[regionKey as keyof typeof CLIMATE_ZONE_GROUPS];
    onChange(selectedZones.filter(z => !group.zones.includes(z)));
  };

  const selectedRegions = getSelectedRegions();

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Climate Zone
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
              {selectedZones.length > 0 && (
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
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg overflow-auto">
              {Object.entries(CLIMATE_ZONE_GROUPS).map(([key, group]) => {
                const allSelected = group.zones.every(z => selectedZones.includes(z));

                return (
                  <label
                    key={key}
                    className={`flex items-center px-3 py-3 hover:bg-opacity-75 cursor-pointer text-sm text-gray-700 border-b last:border-b-0 ${group.color}`}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleRegion(key)}
                      className="w-4 h-4 rounded border-gray-300 bg-white text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 flex-shrink-0"
                    />
                    <div className="ml-2 flex flex-col">
                      <span className="font-medium">{group.name}</span>
                      <span className="text-xs text-gray-600">Zones: {group.zones.join(', ').toUpperCase()}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selectedRegions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedRegions.map((regionKey) => {
            const group = CLIMATE_ZONE_GROUPS[regionKey as keyof typeof CLIMATE_ZONE_GROUPS];
            return (
              <span
                key={regionKey}
                className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded"
              >
                {group.name} ({group.zones.join(', ').toUpperCase()})
                <button
                  onClick={(e) => removeRegion(regionKey, e)}
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
  );
};

export const PlantFilters: React.FC<PlantFiltersProps> = ({ filters, onFilterChange }) => {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Plant Filters</h2>
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
        label="Color"
        options={COLORS}
        selectedValues={filters.colors}
        onChange={(values) => onFilterChange({ ...filters, colors: values })}
      />

      <MultiSelectDropdown
        label="Category"
        options={PLANT_TYPES}
        selectedValues={filters.plantTypes}
        onChange={(values) => onFilterChange({ ...filters, plantTypes: values })}
      />

      {filters.plantTypes.includes('perennial') && (
        <div>
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={filters.naturalisticPlantingDesign}
              onChange={(e) => onFilterChange({ ...filters, naturalisticPlantingDesign: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 bg-white text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-gray-900">Matrix Approach</span>
          </label>
        </div>
      )}

      {filters.naturalisticPlantingDesign && (
        <MultiSelectDropdown
          label="Layer"
          options={LAYERS}
          selectedValues={filters.layers}
          onChange={(values) => onFilterChange({ ...filters, layers: values })}
          tooltip="The layers considered are from existing projects."
        />
      )}

      <MultiSelectDropdown
        label="Sun Exposure"
        options={SUN_REQUIREMENTS}
        selectedValues={filters.sunRequirements}
        onChange={(values) => onFilterChange({ ...filters, sunRequirements: values })}
      />

      <MultiSelectDropdown
        label="Size (Perennials & Grasses)"
        options={PLANT_SIZES}
        selectedValues={filters.sizes}
        onChange={(values) => onFilterChange({ ...filters, sizes: values })}
      />

      <MultiSelectDropdown
        label="Usage"
        options={USAGE_CATEGORIES}
        selectedValues={filters.usageCategories}
        onChange={(values) => onFilterChange({ ...filters, usageCategories: values })}
      />

      <ClimateZoneSelector
        selectedZones={filters.climateZones}
        onChange={(zones) => onFilterChange({ ...filters, climateZones: zones })}
      />

      <div>
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <input
            type="checkbox"
            checked={filters.treeOfTheFuture}
            onChange={(e) => onFilterChange({ ...filters, treeOfTheFuture: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 bg-white text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0"
          />
          <div className="flex items-center gap-2">
            <img
              src="/trees_of_the_future.png"
              alt="Tree of the Future"
              className="w-6 h-6 object-contain flex-shrink-0"
              title="Tree of the Future"
            />
            <span className="text-sm font-medium text-gray-900">Tree of the Future</span>
          </div>
        </label>
      </div>

      <MultiSelectDropdown
        label="Leaf persistence"
        options={LEAF_PERSISTENCE_OPTIONS}
        selectedValues={filters.leafPersistence}
        onChange={(values) => onFilterChange({ ...filters, leafPersistence: values })}
      />

      <MultiSelectDropdown
        label="Native status"
        options={NATIVE_STATUS_OPTIONS}
        selectedValues={filters.nativeStatus}
        onChange={(values) => onFilterChange({ ...filters, nativeStatus: values })}
      />

      <MultiSelectDropdown
        label="Biodiversity"
        options={BIODIVERSITY_OPTIONS}
        selectedValues={filters.biodiversity}
        onChange={(values) => onFilterChange({ ...filters, biodiversity: values })}
      />
    </div>
  );
};
