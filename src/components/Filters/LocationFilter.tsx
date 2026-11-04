import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Info, X, ChevronDown } from 'lucide-react';
import { getZoneConfidenceLabel, getZoneConfidenceColor } from '../../lib/zoneDetection';
import { detectZoneForLocation, ZoneDetectionHelperResult } from '../../lib/zoneDetectionHelper';
import { nominatimService, GeocodingResult } from '../../lib/nominatimService';

interface LocationFilterProps {
  onRegionDetected?: (regions: string[]) => void;
  onZoneDetected?: (zones: string[]) => void;
  mode: 'zones' | 'regions'; // 'zones' for plants, 'regions' for stones
}


export const LocationFilter: React.FC<LocationFilterProps> = ({
  onRegionDetected,
  onZoneDetected,
  mode
}) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedRegion, setDetectedRegion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoneResult, setZoneResult] = useState<ZoneDetectionHelperResult | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
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
      if (address.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setSearchLoading(true);
      try {
        const results = await nominatimService.searchByQuery(address);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(debounceTimer);
  }, [address]);

  const mapZoneToRegion = (zone: string): string => {
    const zoneNum = parseInt(zone.replace(/[ab]/g, ''));
    if (zoneNum <= 6) return 'alpine';
    if (zoneNum <= 8) return 'central_european';
    return 'mediterranean';
  };

  const handleSelectSuggestion = async (suggestion: GeocodingResult) => {
    setAddress(suggestion.displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    setLoading(true);
    setError(null);

    try {
      const result = await detectZoneForLocation(
        suggestion.latitude,
        suggestion.longitude,
        suggestion.cityName
      );

      if (mode === 'zones') {
        setZoneResult(result);
        setDetectedRegion(result.zone);
        onZoneDetected?.([result.zone]);
      } else {
        const region = mapZoneToRegion(result.zone);
        setZoneResult(result);
        setDetectedRegion(region);
        onRegionDetected?.([region]);
      }
    } catch (err) {
      setError('Failed to detect hardiness zones for this location.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAddress = () => {
    setAddress('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    setZoneResult(null);
    setDetectedRegion(null);
    setSelectedZones([]);
    setSelectedRegions([]);
    if (mode === 'zones') {
      onZoneDetected?.([]);
    } else {
      onRegionDetected?.([]);
    }
  };

  const handleAddressSearch = async () => {
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const geocodeResults = await nominatimService.searchByQuery(address);

      if (!geocodeResults || geocodeResults.length === 0) {
        setError('Location not found. Please try a different address.');
        setLoading(false);
        return;
      }

      const firstResult = geocodeResults[0];
      const result = await detectZoneForLocation(
        firstResult.latitude,
        firstResult.longitude,
        firstResult.cityName
      );

      if (mode === 'zones') {
        setZoneResult(result);
        setDetectedRegion(result.zone);
        onZoneDetected?.([result.zone]);
      } else {
        const region = mapZoneToRegion(result.zone);
        setZoneResult(result);
        setDetectedRegion(region);
        onRegionDetected?.([region]);
      }
    } catch (err) {
      setError('Failed to find location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);
  const zoneDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(event.target as Node)) {
        setZoneDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ZONE_OPTIONS = ['1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b', '5a', '5b', '6a', '6b', '7a', '7b', '8a', '8b', '9a', '9b', '10a', '10b'];
  const ZONE_LABELS: Record<string, string> = {
    '1a': '1a (Extreme)', '1b': '1b',
    '2a': '2a (Very Frigid)', '2b': '2b',
    '3a': '3a (Frigid)', '3b': '3b',
    '4a': '4a (Very Cold)', '4b': '4b',
    '5a': '5a (Cold)', '5b': '5b',
    '6a': '6a (Cool)', '6b': '6b',
    '7a': '7a (Mild)', '7b': '7b',
    '8a': '8a (Warm)', '8b': '8b',
    '9a': '9a (Very Warm)', '9b': '9b',
    '10a': '10a (Tropical)', '10b': '10b',
  };
  const REGION_OPTIONS = [
    { value: 'subarctic', label: 'Subarctic (Zones 1a-4b)' },
    { value: 'alpine', label: 'Alpine (Zones 5a-6b)' },
    { value: 'central_european', label: 'Central European (Zones 7a-8b)' },
    { value: 'mediterranean', label: 'Mediterranean (Zones 9a-10b)' },
  ];

  const _handleManualRegionSelect = (region: string) => {
    void region; void _handleManualRegionSelect;
    setDetectedRegion(region);
    setZoneResult(null);
    if (mode === 'zones') {
      if (region) {
        onZoneDetected?.([region]);
      } else {
        onZoneDetected?.([]);
      }
    } else {
      if (region) {
        onRegionDetected?.([region]);
      } else {
        onRegionDetected?.([]);
      }
    }
  };

  const toggleZone = (zone: string) => {
    const updated = selectedZones.includes(zone)
      ? selectedZones.filter(z => z !== zone)
      : [...selectedZones, zone];
    setSelectedZones(updated);
    onZoneDetected?.(updated);
  };

  const clearZones = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedZones([]);
    onZoneDetected?.([]);
  };

  const toggleRegion = (region: string) => {
    const updated = selectedRegions.includes(region)
      ? selectedRegions.filter(r => r !== region)
      : [...selectedRegions, region];
    setSelectedRegions(updated);
    onRegionDetected?.(updated);
  };

  const clearRegions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRegions([]);
    onRegionDetected?.([]);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Address Search</h2>

      <div className="space-y-3">
        <div ref={wrapperRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !showSuggestions && handleAddressSearch()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="st. moritz"
              className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors mb-2"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-2 w-4 h-4 text-gray-500 animate-spin" />
            )}
            {!searchLoading && address && (
              <button
                onClick={handleClearAddress}
                className="absolute right-3 top-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-[2000] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                {suggestions.map((suggestion, index) => {
                  // Parse display name to show location hierarchy better
                  const displayParts = suggestion.displayName.split(',').map(s => s.trim());
                  const mainLocation = displayParts[0];
                  const secondaryLocation = displayParts.slice(1, 3).join(', ');

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      <MapPin className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-gray-900 text-sm">
                            {mainLocation}
                          </span>
                          {suggestion.countryCode && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {suggestion.countryCode}
                            </span>
                          )}
                        </div>
                        {secondaryLocation && (
                          <div className="text-xs text-gray-600 line-clamp-1">
                            {secondaryLocation}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleAddressSearch}
          disabled={loading || !address.trim()}
          className="w-full px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-gray-300"
        >
          {loading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : 'Detect Region'}
        </button>

        {error && (
          <div className="text-sm text-red-400 bg-red-950 p-3 rounded-lg border border-red-800">
            {error}
          </div>
        )}

        {detectedRegion && (
          <div className="bg-emerald-900 border border-emerald-700 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-emerald-200">
              Detected Region: <span className="font-bold">
                {mode === 'zones' && zoneResult
                  ? mapZoneToRegion(zoneResult.zone).replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                  : detectedRegion.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </span>
            </p>

            {zoneResult && (
              <div className="space-y-1">
                <p className="text-xs text-emerald-300">
                  Hardiness zone: <span className="font-semibold">{zoneResult.zone}</span>
                </p>

                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <Info className="w-3 h-3" />
                  <span>Confidence: </span>
                  <span className={`font-semibold ${getZoneConfidenceColor(zoneResult.confidence)}`}>
                    {getZoneConfidenceLabel(zoneResult.confidence)} ({Math.round(zoneResult.confidence * 100)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-gray-300" ref={zoneDropdownRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setZoneDropdownOpen(!zoneDropdownOpen)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  {mode === 'zones'
                    ? (selectedZones.length === 0 ? 'All Hardiness Zones' : `${selectedZones.length} zone${selectedZones.length > 1 ? 's' : ''} selected`)
                    : (selectedRegions.length === 0 ? 'All Regions' : `${selectedRegions.length} region${selectedRegions.length > 1 ? 's' : ''} selected`)}
                </span>
                <div className="flex items-center gap-2">
                  {(mode === 'zones' ? selectedZones.length : selectedRegions.length) > 0 && (
                    <button
                      onClick={mode === 'zones' ? clearZones : clearRegions}
                      className="p-0.5 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${zoneDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </button>

            {zoneDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                {mode === 'zones'
                  ? ZONE_OPTIONS.map((zone) => (
                      <label
                        key={zone}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedZones.includes(zone)}
                          onChange={() => toggleZone(zone)}
                          className="w-4 h-4 rounded border-gray-300 bg-white text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0"
                        />
                        <span className="ml-2">{ZONE_LABELS[zone]}</span>
                      </label>
                    ))
                  : REGION_OPTIONS.map((region) => (
                      <label
                        key={region.value}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRegions.includes(region.value)}
                          onChange={() => toggleRegion(region.value)}
                          className="w-4 h-4 rounded border-gray-300 bg-white text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0"
                        />
                        <span className="ml-2">{region.label}</span>
                      </label>
                    ))}
              </div>
            )}
          </div>

          {mode === 'zones' && selectedZones.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedZones.map((zone) => (
                <span
                  key={zone}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded"
                >
                  {zone.toUpperCase()}
                  <button
                    onClick={() => toggleZone(zone)}
                    className="hover:bg-cyan-200 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {mode === 'regions' && selectedRegions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedRegions.map((region) => (
                <span
                  key={region}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded"
                >
                  {REGION_OPTIONS.find(r => r.value === region)?.label ?? region}
                  <button
                    onClick={() => toggleRegion(region)}
                    className="hover:bg-cyan-200 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
