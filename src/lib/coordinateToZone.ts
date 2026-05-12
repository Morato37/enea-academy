export interface ZoneMapping {
  zoneCode: string;
  confidenceScore: number;
}

/**
 * @deprecated This function uses a simplified algorithm and should NOT be used for production.
 * It does not account for:
 * - Elevation data (even when passed, it's often 0 by default)
 * - City database lookups (Jelitto data)
 * - Microclimate adjustments
 * - Climate data verification
 *
 * Use detectHardinessZones() from zoneDetection.ts instead for accurate results.
 * This function is kept only as an emergency fallback.
 */
export function coordinatesToHardinessZone(
  latitude: number,
  longitude: number,
  elevation: number = 0
): ZoneMapping {
  const elevationAdjustment = Math.floor(elevation / 150) * 0.5;

  let baseZone = calculateBaseZone(latitude, longitude);

  const maritimeBonus = calculateMaritimeInfluence(latitude, longitude);
  const continentalPenalty = calculateContinentalInfluence(latitude, longitude);

  let finalZone = baseZone + maritimeBonus - continentalPenalty - elevationAdjustment;

  finalZone = Math.max(3, Math.min(11, finalZone));

  const zoneNumber = Math.floor(finalZone);
  const zoneFraction = finalZone - zoneNumber;
  const subZone = zoneFraction < 0.5 ? 'a' : 'b';

  const confidenceScore = calculateConfidence(latitude, longitude, elevation);

  return {
    zoneCode: `${zoneNumber}${subZone}`,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
  };
}

function calculateBaseZone(latitude: number, _longitude: number): number {
  if (latitude >= 67) return 3.5;
  if (latitude >= 64) return 4.5;
  if (latitude >= 61) return 5.5;
  if (latitude >= 58) return 6.0;
  if (latitude >= 55) return 6.5;
  if (latitude >= 52) return 7.0;
  if (latitude >= 49) return 7.5;
  if (latitude >= 46) return 8.0;
  if (latitude >= 43) return 8.5;
  if (latitude >= 40) return 9.0;
  if (latitude >= 37) return 9.5;
  return 10.0;
}

function calculateMaritimeInfluence(latitude: number, longitude: number): number {
  const atlanticCoast = longitude < -5 || (longitude < 2 && latitude > 48);
  if (atlanticCoast) return 1.0;

  const mediterraneanSouth = latitude < 44 && longitude > 2 && longitude < 20;
  if (mediterraneanSouth) return 1.5;

  const mediterraneanEast = latitude < 40 && longitude > 20;
  if (mediterraneanEast) return 2.0;

  const westernCoast = longitude < 5 && latitude > 43;
  if (westernCoast) return 0.5;

  return 0;
}

function calculateContinentalInfluence(latitude: number, longitude: number): number {
  if (longitude > 30) return 1.5;

  if (longitude > 20 && latitude > 45) return 1.0;

  if (longitude > 15 && latitude > 50) return 0.5;

  return 0;
}

function calculateConfidence(latitude: number, longitude: number, elevation: number): number {
  let confidence = 0.85;

  if (latitude < 40 || latitude > 60) {
    confidence -= 0.05;
  }

  if (longitude < -5 || longitude > 40) {
    confidence -= 0.05;
  }

  if (elevation > 1000) {
    confidence -= 0.1;
  } else if (elevation > 500) {
    confidence -= 0.05;
  }

  const knownHighConfidenceRegions = [
    { latMin: 47, latMax: 50, lonMin: 6, lonMax: 15 },
    { latMin: 51, latMax: 53, lonMin: 8, lonMax: 15 },
    { latMin: 48, latMax: 49, lonMin: 10, lonMax: 13 },
  ];

  for (const region of knownHighConfidenceRegions) {
    if (
      latitude >= region.latMin &&
      latitude <= region.latMax &&
      longitude >= region.lonMin &&
      longitude <= region.lonMax
    ) {
      confidence = Math.min(0.95, confidence + 0.1);
      break;
    }
  }

  return Math.max(0.6, Math.min(0.95, confidence));
}

export function getRegionNameFromZone(zoneCode: string, _countryCode: string): string {
  const zoneNumber = parseInt(zoneCode);

  if (zoneNumber >= 9) {
    return 'Mediterranean / Warm Temperate';
  } else if (zoneNumber >= 7) {
    return 'Central European / Temperate';
  } else if (zoneNumber >= 5) {
    return 'Northern European / Cool Temperate';
  } else {
    return 'Sub-Arctic / Alpine';
  }
}
