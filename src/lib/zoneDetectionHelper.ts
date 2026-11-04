import { supabase } from './supabase';
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

      const { data: nearbyCities } = await supabase
        .from('city_hardiness_zones')
        .select('*')
        .gte('latitude', latitude - 0.5)
        .lte('latitude', latitude + 0.5)
        .gte('longitude', longitude - 0.5)
        .lte('longitude', longitude + 0.5)
        .limit(10);

      if (nearbyCities && nearbyCities.length > 0) {
        const closest = nearbyCities.reduce((prev, curr) => {
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
  elevation?: number,
  skipElevationFetch: boolean = false
): Promise<ZoneDetectionHelperResult> {
  const actualElevation = elevation !== undefined
    ? elevation
    : skipElevationFetch
      ? undefined
      : await fetchElevation(latitude, longitude);

  const cityPromise = cityName
    ? detectZoneFromCity(cityName, latitude, longitude)
    : Promise.resolve(null);

  const zonePromise = detectHardinessZones(latitude, longitude, actualElevation);

  const [cityResult, zoneResult] = await Promise.all([cityPromise, zonePromise]);

  let finalZone: string;
  let finalConfidence: number;
  let finalSource: string;

  if (cityResult) {
    finalZone = cityResult.zone;
    finalConfidence = cityResult.confidence;
    finalSource = cityResult.source;
  } else {
    finalZone = zoneResult.zones[0];
    finalConfidence = zoneResult.confidence;
    finalSource = zoneResult.source;
  }

  return {
    zone: finalZone,
    confidence: finalConfidence,
    source: finalSource,
    microclimateInfo: undefined,
    elevation: actualElevation,
  };
}
