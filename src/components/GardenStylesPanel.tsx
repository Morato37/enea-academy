import React from 'react';
import { PlantFilterState } from './Filters/PlantFilters';
import { Check, BookOpen } from 'lucide-react';

const GARDEN_STYLES: { key: string; label: string; color: string }[] = [
  { key: 'new_japanese', label: 'New Japanese', color: '#8ba888' },
  { key: 'alpine', label: 'Alpine', color: '#a0b8d8' },
  { key: 'residential', label: 'Residential', color: '#d4c4a8' },
  { key: 'mediterranean', label: 'Mediterranean', color: '#d89a6a' },
  { key: 'swiss_farmhouse', label: 'Swiss Farmhouse', color: '#c8b890' },
  { key: 'wild', label: 'Wild', color: '#9ac0a0' },
];

const STYLE_BOOKS: { id: string; key: string; title: string; author: string; cover: string }[] = [
  {
    id: 'new_japanese_1',
    key: 'new_japanese',
    title: 'Borrowed Sceneries',
    author: 'Rahel Hartmann Schweizer',
    cover: '/images/newjap/NewJap.jpeg',
  },
  {
    id: 'residential_1',
    key: 'residential',
    title: 'The Dynamic Landscape',
    author: 'Nigel Dunnett and James Hitchmough',
    cover: '/images/wild/Residential_Wild.jpeg',
  },
  {
    id: 'residential_2',
    key: 'residential',
    title: 'Planting in a Post-Wild World',
    author: 'Thomas Rainer and Claudia West',
    cover: '/images/wild/Wild_Residential.jpeg',
  },
  {
    id: 'residential_3',
    key: 'residential',
    title: 'Bringing Nature Home',
    author: 'Doug Tallamy',
    cover: '/images/wild/Wild_Residential1.jpeg',
  },
  {
    id: 'mediterranean_1',
    key: 'mediterranean',
    title: 'Bringing the Mediterranean into Your Garden',
    author: 'Olivier Filippi',
    cover: '/images/mediterranean/Mediteranean.jpeg',
  },
  {
    id: 'swiss_farmhouse_1',
    key: 'swiss_farmhouse',
    title: 'The Food Forward Garden',
    author: 'Swiss Farmhouse Edition',
    cover: '/book-swiss-farmhouse.webp',
  },
  {
    id: 'wild_1',
    key: 'wild',
    title: 'Gardening for Bumblebees',
    author: 'Dave Goulson',
    cover: '/images/wild/Wild.jpeg',
  },
  {
    id: 'wild_2',
    key: 'wild',
    title: 'The Wild Garden',
    author: 'Noel Kingsbury',
    cover: '/images/wild/Wild1.jpeg',
  },
  {
    id: 'wild_3',
    key: 'wild',
    title: 'Wild about Weeds',
    author: 'Jack Wallington',
    cover: '/images/wild/Wild2.jpeg',
  },
  {
    id: 'wild_4',
    key: 'wild',
    title: 'The Living Landscape',
    author: 'Rick Darke and Doug Tallamy',
    cover: '/images/wild/Wild3.jpeg',
  },
];

interface GardenStylesPanelProps {
  filters: PlantFilterState;
  onFilterChange: (filters: PlantFilterState) => void;
}

export const GardenStylesPanel: React.FC<GardenStylesPanelProps> = ({ filters, onFilterChange }) => {
  const toggleStyle = (key: string) => {
    const next = filters.gardenStyles.includes(key)
      ? filters.gardenStyles.filter(s => s !== key)
      : [...filters.gardenStyles, key];
    onFilterChange({ ...filters, gardenStyles: next });
  };

  const clearAll = () => {
    onFilterChange({ ...filters, gardenStyles: [] });
  };

  const selectedBooks = STYLE_BOOKS.filter(book => filters.gardenStyles.includes(book.key));

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Garden Styles</h3>
        {filters.gardenStyles.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-2">
        {GARDEN_STYLES.map((style) => {
          const isActive = filters.gardenStyles.includes(style.key);
          return (
            <button
              key={style.key}
              onClick={() => toggleStyle(style.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                isActive
                  ? 'border-cyan-400 bg-cyan-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-300 flex items-center justify-center"
                style={{ backgroundColor: isActive ? style.color : 'transparent' }}
              >
                {isActive && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                {style.label}
              </span>
            </button>
          );
        })}
      </div>

      {filters.gardenStyles.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {filters.gardenStyles.length} style{filters.gardenStyles.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {selectedBooks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-1.5 mb-3">
            <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
            <p className="text-xs font-semibold text-gray-700">
              {selectedBooks.length} Book Recommendation{selectedBooks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-3">
            {selectedBooks.map(book => (
              <div key={book.id} className="flex gap-3 items-start">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-16 h-22 object-cover rounded shadow-sm border border-gray-200 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{book.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
