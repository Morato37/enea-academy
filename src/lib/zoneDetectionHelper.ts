import { supabase } from './supabase';
import { calculateEnhancedZone, formatMicroclimateFactors } from './microclimate';
import { detectHardinessZones } from './zoneDetection';

export interface ZoneDetectionHelperResult {
  zone: string;
  confidence: number;
  source: string;
  microclimateInfo?: string;
  elevation?: number;
}

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

async function detectZoneFromCity(
  cityName: string,
  latitude: number,
  longitude: number
): Promise<{ zone: string; confidence: number; source: string; dataSource?: string } | null> {
  try {
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
            zone: closest.zone_code,
            confidence: 0.98,
            source: 'city',
            dataSource: closest.data_source,
          };
        }
      }

      return null;
    }

    return {
      zone: cityZone.zone_code,
      confidence: 0.99,
      source: 'city',
      dataSource: cityZone.data_source,
    };
  } catch (error) {
    console.error('City zone detection failed:', error);
    return null;
  }
}

export async function detectZoneForLocation(
  latitude: number,
  longitude: number,
  cityName?: string,
  elevation?: number
): Promise<ZoneDetectionHelperResult> {
  const actualElevation = elevation !== undefined ? elevation : await fetchElevation(latitude, longitude);

  let cityResult = null;
  if (cityName) {
    cityResult = await detectZoneFromCity(cityName, latitude, longitude);
  }

  let finalZone: string;
  let finalConfidence: number;
  let finalSource: string;
  let microclimateInfo: string | undefined;

  if (cityResult) {
    const enhanced = await calculateEnhancedZone(
      cityResult.zone,
      latitude,
      longitude,
      cityName
    );

    finalZone = enhanced.adjustedZone;
    finalConfidence = Math.max(cityResult.confidence, enhanced.confidence);
    finalSource = enhanced.adjustments.some(a => a.factor === 'admin_override')
      ? 'admin_verified'
      : enhanced.adjustments.some(a => a.factor === 'climate_data')
      ? 'climate_data'
      : cityResult.source;
    microclimateInfo = formatMicroclimateFactors(enhanced.adjustments);
  } else {
    const zoneResult = await detectHardinessZones(
      latitude,
      longitude,
      actualElevation
    );

    const enhanced = await calculateEnhancedZone(
      zoneResult.zones[0],
      latitude,
      longitude,
      cityName
    );

    finalZone = enhanced.adjustedZone;
    finalConfidence = Math.max(zoneResult.confidence, enhanced.confidence);
    finalSource = enhanced.adjustments.some(a => a.factor === 'admin_override')
      ? 'admin_verified'
      : enhanced.adjustments.some(a => a.factor === 'climate_data')
      ? 'climate_data'
      : zoneResult.source;
    microclimateInfo = formatMicroclimateFactors(enhanced.adjustments);
  }

  return {
    zone: finalZone,
    confidence: finalConfidence,
    source: finalSource,
    microclimateInfo,
    elevation: actualElevation,
  };
}
