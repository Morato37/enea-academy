import { supabase } from './supabase';
import { calculateEnhancedZone, formatMicroclimateFactors, type MicroclimateAdjustment } from './microclimate';

export interface ZoneDetectionResult {
  zones: string[];
  confidence: number;
  region?: string;
  elevation?: number;
  source: 'city' | 'database' | 'fallback' | 'cache' | 'admin_verified' | 'climate_data';
  dataSource?: string;
  microclimateFactors?: string;
  adjustments?: MicroclimateAdjustment[];
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  elevation?: number;
  countryCode?: string;
  displayName?: string;
}

const ELEVATION_ZONE_ADJUSTMENT = 150;

async function fetchElevation(lat: number, lon: number): Promise<number | undefined> {
  try {
    const response = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
    );

    if (!response.ok) return undefined;

    const data = await response.json();
    return data.results?.[0]?.elevation;
  } catch (error) {
    console.warn('Elevation fetch failed:', error);
    return undefined;
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const { data: cached } = await supabase
      .from('geocode_cache')
      .select('*')
      .eq('address', address.toLowerCase())
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return {
        latitude: Number(cached.latitude),
        longitude: Number(cached.longitude),
        elevation: cached.elevation ? Number(cached.elevation) : undefined,
        countryCode: cached.country_code || undefined,
      };
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.length === 0) return null;

    const result = data[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    const countryCode = result.address?.country_code?.toUpperCase();

    const elevation = await fetchElevation(latitude, longitude);

    try {
      await supabase.from('geocode_cache').insert({
        address: address.toLowerCase(),
        latitude,
        longitude,
        elevation,
        country_code: countryCode,
        detected_zones: [],
        confidence_score: 0.5,
      });
    } catch (error) {
      console.warn('Failed to cache geocode result:', error);
    }

    return {
      latitude,
      longitude,
      elevation,
      countryCode,
      displayName: result.display_name,
    };
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
}

function calculateElevationAdjustment(elevation: number): number {
  return Math.floor(elevation / ELEVATION_ZONE_ADJUSTMENT);
}

function adjustZoneForElevation(zoneCode: string, elevationShift: number): string | null {
  const zoneMap: Record<string, number> = {
    '5a': 0, '5b': 1, '6a': 2, '6b': 3, '7a': 4, '7b': 5,
    '8a': 6, '8b': 7, '9a': 8, '9b': 9, '10a': 10, '10b': 11,
  };

  const reverseMap: Record<number, string> = {
    0: '5a', 1: '5b', 2: '6a', 3: '6b', 4: '7a', 5: '7b',
    6: '8a', 7: '8b', 8: '9a', 9: '9b', 10: '10a', 11: '10b',
  };

  const currentIndex = zoneMap[zoneCode];
  if (currentIndex === undefined) return null;

  const newIndex = Math.max(0, Math.min(11, currentIndex - elevationShift));
  return reverseMap[newIndex];
}

async function detectZoneFromCity(
  address: string,
  latitude: number,
  longitude: number
): Promise<ZoneDetectionResult | null> {
  try {
    const cityName = address.split(',')[0].trim().toLowerCase();

    const { data: cityZone, error } = await supabase
      .from('city_hardiness_zones')
      .select('*')
      .ilike('city_name', cityName)
      .maybeSingle();

    if (error || !cityZone) {
      const distance = (lat: number, lon: number) =>
        Math.sqrt(Math.pow(lat - latitude, 2) + Math.pow(lon - longitude, 2));

      const { data: nearestCity } = await supabase
        .from('city_hardiness_zones')
        .select('*')
        .order('latitude')
        .limit(50);

      if (nearestCity && nearestCity.length > 0) {
        const closest = nearestCity.reduce((prev, curr) => {
          const prevDist = distance(Number(prev.latitude), Number(prev.longitude));
          const currDist = distance(Number(curr.latitude), Number(curr.longitude));
          return currDist < prevDist ? curr : prev;
        });

        const dist = distance(Number(closest.latitude), Number(closest.longitude));
        if (dist < 0.1) {
          return {
            zones: [closest.zone_code],
            confidence: 0.98,
            region: closest.city_name,
            source: 'city',
            dataSource: closest.data_source,
          };
        }
      }

      return null;
    }

    return {
      zones: [cityZone.zone_code],
      confidence: 0.99,
      region: cityZone.city_name,
      source: 'city',
      dataSource: cityZone.data_source,
    };
  } catch (error) {
    console.error('City zone detection failed:', error);
    return null;
  }
}

async function detectZonesFromClimateData(
  latitude: number,
  longitude: number
): Promise<ZoneDetectionResult | null> {
  try {
    const searchRadius = 0.5;

    const { data: climatePoints, error } = await supabase
      .from('climate_data_points')
      .select('*')
      .gte('latitude', latitude - searchRadius)
      .lte('latitude', latitude + searchRadius)
      .gte('longitude', longitude - searchRadius)
      .lte('longitude', longitude + searchRadius)
      .order('confidence_score', { ascending: false })
      .limit(5);

    if (error || !climatePoints || climatePoints.length === 0) {
      return null;
    }

    const distanceCalc = (lat: number, lon: number) =>
      Math.sqrt(Math.pow(lat - latitude, 2) + Math.pow(lon - longitude, 2));

    const closestPoint = climatePoints.reduce((prev, curr) => {
      const prevDist = distanceCalc(Number(prev.latitude), Number(prev.longitude));
      const currDist = distanceCalc(Number(curr.latitude), Number(curr.longitude));
      return currDist < prevDist ? curr : prev;
    });

    const distance = distanceCalc(Number(closestPoint.latitude), Number(closestPoint.longitude));

    const confidenceAdjustment = distance > 0.25 ? 0.85 : 0.95;

    return {
      zones: [closestPoint.hardiness_zone],
      confidence: Number(closestPoint.confidence_score) * confidenceAdjustment,
      source: 'climate_data',
      dataSource: closestPoint.data_source,
    };
  } catch (error) {
    console.error('Climate data detection failed:', error);
    return null;
  }
}

async function detectZonesFromDatabase(
  latitude: number,
  longitude: number,
  elevation?: number
): Promise<ZoneDetectionResult | null> {
  try {
    const { data: boundaries, error } = await supabase
      .from('zone_boundaries')
      .select('*')
      .lte('latitude_min', latitude)
      .gte('latitude_max', latitude)
      .lte('longitude_min', longitude)
      .gte('longitude_max', longitude)
      .order('priority', { ascending: false });

    if (error || !boundaries || boundaries.length === 0) {
      return null;
    }

    let matchedBoundaries = boundaries;

    if (elevation !== undefined) {
      const elevationFiltered = boundaries.filter(
        b => elevation >= (b.elevation_min || 0) && elevation <= (b.elevation_max || 9999)
      );

      if (elevationFiltered.length > 0) {
        matchedBoundaries = elevationFiltered;
      } else {
        const elevationShift = calculateElevationAdjustment(elevation);
        const baseZones = boundaries.map(b => b.zone_code);
        const adjustedZones = baseZones
          .map(zone => adjustZoneForElevation(zone, elevationShift))
          .filter((z): z is string => z !== null);

        if (adjustedZones.length > 0) {
          return {
            zones: Array.from(new Set(adjustedZones)).sort().slice(0, 1),
            confidence: Math.max(...boundaries.map(b => Number(b.confidence_score))) * 0.85,
            elevation,
            region: boundaries[0]?.region_name,
            source: 'database',
            dataSource: boundaries[0]?.data_source || 'estimated',
          };
        }
      }
    }

    const verifiedBoundaries = matchedBoundaries.filter(b => b.is_verified === true);
    if (verifiedBoundaries.length > 0) {
      matchedBoundaries = verifiedBoundaries;
    }

    matchedBoundaries.sort((a, b) => {
      if (b.is_verified !== a.is_verified) return b.is_verified ? 1 : -1;
      if (b.priority !== a.priority) return (b.priority || 50) - (a.priority || 50);
      return Number(b.confidence_score) - Number(a.confidence_score);
    });

    const topBoundary = matchedBoundaries[0];
    const topConfidence = Number(topBoundary.confidence_score);

    if (topBoundary.is_verified && topConfidence >= 0.90) {
      return {
        zones: [topBoundary.zone_code],
        confidence: topConfidence,
        elevation,
        region: topBoundary.region_name,
        source: 'database',
        dataSource: topBoundary.data_source || 'estimated',
      };
    }

    const zones = Array.from(new Set(matchedBoundaries.slice(0, 2).map(b => b.zone_code))).sort();
    const avgConfidence = matchedBoundaries.slice(0, 2).reduce((sum, b) => sum + Number(b.confidence_score), 0) / Math.min(2, matchedBoundaries.length);

    return {
      zones,
      confidence: avgConfidence,
      elevation,
      region: topBoundary.region_name,
      source: 'database',
      dataSource: topBoundary.data_source || 'estimated',
    };
  } catch (error) {
    console.error('Database zone detection failed:', error);
    return null;
  }
}

function fallbackZoneDetection(latitude: number, elevation?: number): ZoneDetectionResult {
  let baseZone: string;

  if (latitude >= 65) {
    baseZone = '5a';
  } else if (latitude >= 62) {
    baseZone = '5b';
  } else if (latitude >= 58) {
    baseZone = '6a';
  } else if (latitude >= 55) {
    baseZone = '6b';
  } else if (latitude >= 52) {
    baseZone = '7a';
  } else if (latitude >= 48) {
    baseZone = '7b';
  } else if (latitude >= 46) {
    baseZone = '8a';
  } else if (latitude >= 44) {
    baseZone = '8b';
  } else if (latitude >= 41) {
    baseZone = '9a';
  } else if (latitude >= 38) {
    baseZone = '9b';
  } else {
    baseZone = '10a';
  }

  if (elevation && elevation > 500) {
    const elevationShift = calculateElevationAdjustment(elevation);
    const adjusted = adjustZoneForElevation(baseZone, elevationShift);
    if (adjusted) {
      baseZone = adjusted;
    }
  }

  return {
    zones: [baseZone],
    confidence: 0.65,
    elevation,
    source: 'fallback',
    dataSource: 'estimated',
  };
}

export async function detectHardinessZones(
  latitude: number,
  longitude: number,
  elevation?: number
): Promise<ZoneDetectionResult> {
  const climateResult = await detectZonesFromClimateData(latitude, longitude);

  if (climateResult && climateResult.confidence >= 0.75) {
    return climateResult;
  }

  const dbResult = await detectZonesFromDatabase(latitude, longitude, elevation);

  if (dbResult && dbResult.confidence >= 0.85) {
    return dbResult;
  }

  if (climateResult) {
    return climateResult;
  }

  if (dbResult && dbResult.confidence >= 0.75) {
    return dbResult;
  }

  const fallback = fallbackZoneDetection(latitude, elevation);

  if (dbResult && dbResult.zones.length > 0) {
    return {
      ...dbResult,
      confidence: Math.max(dbResult.confidence, fallback.confidence),
    };
  }

  return fallback;
}

export async function detectZonesFromAddress(address: string): Promise<ZoneDetectionResult | null> {
  const geocode = await geocodeAddress(address);

  if (!geocode) {
    return null;
  }

  const cityResult = await detectZoneFromCity(
    address,
    geocode.latitude,
    geocode.longitude
  );

  if (cityResult) {
    const enhanced = await calculateEnhancedZone(
      cityResult.zones[0],
      geocode.latitude,
      geocode.longitude,
      address
    );

    const finalResult = {
      ...cityResult,
      zones: [enhanced.adjustedZone],
      confidence: Math.max(cityResult.confidence, enhanced.confidence),
      source: enhanced.adjustments.some(a => a.factor === 'admin_override')
        ? 'admin_verified' as const
        : enhanced.adjustments.some(a => a.factor === 'climate_data')
        ? 'climate_data' as const
        : cityResult.source,
      microclimateFactors: formatMicroclimateFactors(enhanced.adjustments),
      adjustments: enhanced.adjustments,
    };

    try {
      await supabase
        .from('geocode_cache')
        .update({
          detected_zones: finalResult.zones,
          confidence_score: finalResult.confidence,
        })
        .eq('address', address.toLowerCase());
    } catch (error) {
      console.warn('Failed to update cache with zone data:', error);
    }

    return finalResult;
  }

  const result = await detectHardinessZones(
    geocode.latitude,
    geocode.longitude,
    geocode.elevation
  );

  const enhanced = await calculateEnhancedZone(
    result.zones[0],
    geocode.latitude,
    geocode.longitude,
    address
  );

  const finalResult = {
    ...result,
    zones: [enhanced.adjustedZone],
    confidence: Math.max(result.confidence, enhanced.confidence),
    source: enhanced.adjustments.some(a => a.factor === 'admin_override')
      ? 'admin_verified' as const
      : enhanced.adjustments.some(a => a.factor === 'climate_data')
      ? 'climate_data' as const
      : result.source,
    microclimateFactors: formatMicroclimateFactors(enhanced.adjustments),
    adjustments: enhanced.adjustments,
  };

  try {
    await supabase
      .from('geocode_cache')
      .update({
        detected_zones: finalResult.zones,
        confidence_score: finalResult.confidence,
      })
      .eq('address', address.toLowerCase());
  } catch (error) {
    console.warn('Failed to update cache with zone data:', error);
  }

  return finalResult;
}

export function getZoneConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'Very High';
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.7) return 'Good';
  if (confidence >= 0.6) return 'Moderate';
  return 'Low';
}

export function getZoneConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-emerald-400';
  if (confidence >= 0.7) return 'text-green-400';
  if (confidence >= 0.6) return 'text-yellow-400';
  return 'text-orange-400';
}
