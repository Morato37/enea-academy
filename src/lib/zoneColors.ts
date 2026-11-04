export const ZONE_COLORS: Record<string, string> = {
  '1a': '#F0F0FF',
  '1b': '#E0E0F0',
  '2a': '#D8D8D8',
  '2b': '#B4B4B4',
  '3a': '#EDCCE8',
  '3b': '#F040B0',
  '4a': '#A050C8',
  '4b': '#6840A8',
  '5a': '#2B5B8E',
  '5b': '#3B6B9E',
  '6a': '#4B7BAE',
  '6b': '#5B8BBE',
  '7a': '#6B9BCE',
  '7b': '#7BABDE',
  '8a': '#F4E96D',
  '8b': '#F9A23B',
  '9a': '#F97D3C',
  '9b': '#F95D3D',
  '10a': '#F93D3E',
  '10b': '#FA1D3F',
  '11a': '#C41D3F',
  '11b': '#A41D3F',
};

export const ZONE_TEMP_RANGES: Record<string, { min: number; max: number }> = {
  '1a': { min: -51.1, max: -48.3 },
  '1b': { min: -48.3, max: -45.6 },
  '2a': { min: -45.6, max: -42.8 },
  '2b': { min: -42.8, max: -40.0 },
  '3a': { min: -40.0, max: -37.2 },
  '3b': { min: -37.2, max: -34.5 },
  '4a': { min: -34.5, max: -31.7 },
  '4b': { min: -31.7, max: -28.9 },
  '5a': { min: -28.9, max: -26.1 },
  '5b': { min: -26.1, max: -23.3 },
  '6a': { min: -23.3, max: -20.6 },
  '6b': { min: -20.6, max: -17.8 },
  '7a': { min: -17.8, max: -15.0 },
  '7b': { min: -15.0, max: -12.2 },
  '8a': { min: -12.2, max: -9.4 },
  '8b': { min: -9.4, max: -6.7 },
  '9a': { min: -6.7, max: -3.9 },
  '9b': { min: -3.9, max: -1.1 },
  '10a': { min: -1.1, max: 1.7 },
  '10b': { min: 1.7, max: 4.4 },
  '11a': { min: 4.4, max: 7.2 },
  '11b': { min: 7.2, max: 10.0 },
};

export function getZoneColor(zoneCode: string): string {
  return ZONE_COLORS[zoneCode] || '#6B7280';
}

export function getZoneTempRange(zoneCode: string): string {
  const range = ZONE_TEMP_RANGES[zoneCode];
  if (!range) return 'Unknown';
  return `${range.min}°C bis ${range.max}°C`;
}

export function getZoneLabel(zoneCode: string): string {
  const range = ZONE_TEMP_RANGES[zoneCode];
  if (!range) return zoneCode;
  return `Zone ${zoneCode} (${range.min}°C bis ${range.max}°C)`;
}
