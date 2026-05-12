import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { searchPostalCodeSuggestions, PostalCodeResult } from '../../lib/postalCodeSearch';
import { getZoneColor } from '../../lib/zoneColors';

interface PostalCodeSearchProps {
  onLocationSelect: (result: PostalCodeResult) => void;
}

export const PostalCodeSearch: React.FC<PostalCodeSearchProps> = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PostalCodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      const results = await searchPostalCodeSuggestions(query, 8);
      setSuggestions(results);
      setLoading(false);
      setShowSuggestions(true);
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelectSuggestion = (result: PostalCodeResult) => {
    setQuery(`${result.postalCode} - ${result.cityName}`);
    setShowSuggestions(false);
    onLocationSelect(result);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Enter postal code or city..."
          className="w-full pl-12 pr-12 py-3 bg-white border-2 border-white/30 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/50 shadow-md"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[2000] w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {suggestions.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectSuggestion(result)}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-300 last:border-b-0"
              >
                <MapPin className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {result.postalCode}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white text-gray-600">
                      {result.countryCode}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {result.cityName}
                    {result.regionName && `, ${result.regionName}`}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: getZoneColor(result.zoneCode) }}
                    />
                    <span className="text-xs text-gray-600">
                      Zone {result.zoneCode}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
