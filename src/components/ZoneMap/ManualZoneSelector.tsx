import React, { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { ZONE_COLORS, ZONE_TEMP_RANGES } from '../../lib/zoneColors';

interface ManualZoneSelectorProps {
  onZoneSelect: (zoneCode: string) => void;
  activeZone?: string | null;
}

const ALL_ZONES = [
  '1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b',
  '5a', '5b', '6a', '6b', '7a', '7b', '8a', '8b',
  '9a', '9b', '10a', '10b',
];

export const ManualZoneSelector: React.FC<ManualZoneSelectorProps> = ({
  onZoneSelect,
  activeZone,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (zone: string) => {
    if (activeZone === zone) {
      onZoneSelect('');
    } else {
      onZoneSelect(zone);
    }
    setOpen(false);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Filter by Hardiness Zone
          </h3>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
        Select a zone directly when the exact address is confidential or unavailable.
      </p>

      {open && (
        <div className="mt-3 max-h-64 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_ZONES.map((zone) => {
              const range = ZONE_TEMP_RANGES[zone];
              const isActive = activeZone === zone;
              return (
                <button
                  key={zone}
                  onClick={() => handleSelect(zone)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs transition-colors ${
                    isActive
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: ZONE_COLORS[zone] || '#ccc' }}
                  >
                    {isActive && <Check className="w-3 h-3 text-gray-800" />}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-gray-900">{zone}</span>
                    {range && (
                      <span className="text-[10px] text-gray-500 leading-tight">
                        {range.min}° to {range.max}°C
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeZone && !open && (
        <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-md bg-cyan-50 border border-cyan-200">
          <span
            className="w-5 h-5 rounded border border-gray-300 flex-shrink-0"
            style={{ backgroundColor: ZONE_COLORS[activeZone] || '#ccc' }}
          />
          <span className="text-xs font-medium text-gray-900">
            Zone {activeZone} active
          </span>
          <button
            onClick={() => onZoneSelect('')}
            className="ml-auto text-[11px] text-gray-500 hover:text-gray-900"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
