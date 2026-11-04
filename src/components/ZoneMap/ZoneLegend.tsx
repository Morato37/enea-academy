import React from 'react';
import { ZONE_COLORS, ZONE_TEMP_RANGES } from '../../lib/zoneColors';

export const ZoneLegend: React.FC = () => {
  const displayZones = ['1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b', '5a', '5b', '6a', '6b', '7a', '7b', '8a', '8b', '9a', '9b', '10a', '10b'];

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Hardiness Zones</h3>
      <div className="space-y-1.5">
        {displayZones.map((zone) => {
          const range = ZONE_TEMP_RANGES[zone];
          return (
            <div key={zone} className="flex items-center gap-2 text-xs">
              <div
                className="w-6 h-4 rounded border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: ZONE_COLORS[zone] }}
              />
              <span className="text-gray-900 font-medium w-8">{zone}</span>
              <span className="text-gray-600 text-[11px]">
                {range.min}°C to {range.max}°C
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-300">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Average annual minimum temperature based on climate data 1991-2020
        </p>
      </div>
    </div>
  );
};
