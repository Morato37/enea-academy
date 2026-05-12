import { supabase } from './supabase';

export interface MicroclimateAdjustment {
  factor: string;
  adjustment: number;
  description: string;
  confidence: number;
}

export interface EnhancedZoneResult {
  baseZone: string;
  adjustedZone: string;
  adjustments: MicroclimateAdjustment[];
  totalAdjustment: number;
  confidence: number;
}

const ZONE_ORDER = ['5a', '5b', '6a', '6b', '7a', '7b', '8a', '8b', '9a', '9b', '10a', '10b', '11a', '11b'];

function adjustZone(baseZone: string, adjustment: number): string {
  const currentIndex = ZONE_ORDER.indexOf(baseZone);
  if (currentIndex === -1) return baseZone;

  const steps = Math.round(adjustment * 2);
  const newIndex = Math.max(0, Math.min(ZONE_ORDER.length - 1, currentIndex + steps));

  return ZONE_ORDER[newIndex];
}

export async function checkZoneAdjustments(
  address: string,
  latitude: number,
  longitude: number
): Promise<{ zone: string; confidence: number; source: string } | null> {
  try {
    const addressLower = address.toLowerCase().trim();

    const { data: adjustments } = await supabase
      .from('zone_adjustments')
      .select('*')
      .eq('is_active', true)
      .or(`LOWER(location_identifier).eq.${addressLower},and(latitude.eq.${latitude},longitude.eq.${longitude})`);

    if (adjustments && adjustments.length > 0) {
      const adjustment = adjustments[0];
      return {
        zone: adjustment.adjusted_zone,
        confidence: Number(adjustment.confidence_score),
        source: 'admin_verified',
      };
    }

    const distance = (lat: number, lon: number) =>
      Math.sqrt(Math.pow(lat - latitude, 2) + Math.pow(lon - longitude, 2));

    const { data: nearbyAdjustments } = await supabase
      .from('zone_adjustments')
      .select('*')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (nearbyAdjustments && nearbyAdjustments.length > 0) {
      const closest = nearbyAdjustments.reduce((prev, curr) => {
        if (!curr.latitude || !curr.longitude) return prev;
        if (!prev.latitude || !prev.longitude) return curr;

        const prevDist = distance(Number(prev.latitude), Number(prev.longitude));
        const currDist = distance(Number(curr.latitude), Number(curr.longitude));
        return currDist < prevDist ? curr : prev;
      });

      if (closest.latitude && closest.longitude) {
        const dist = distance(Number(closest.latitude), Number(closest.longitude));
        if (dist < 0.05) {
          return {
            zone: closest.adjusted_zone,
            confidence: Number(closest.confidence_score) * 0.90,
            source: 'admin_verified_nearby',
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Zone adjustment check failed:', error);
    return null;
  }
}

export async function getClimateDataPoint(
  latitude: number,
  longitude: number,
  radius: number = 0.1
): Promise<{ zone: string; confidence: number; minTemp: number } | null> {
  try {
    const { data: climatePoints } = await supabase
      .from('climate_data_points')
      .select('*')
      .gte('latitude', latitude - radius)
      .lte('latitude', latitude + radius)
      .gte('longitude', longitude - radius)
      .lte('longitude', longitude + radius)
      .order('confidence_score', { ascending: false })
      .limit(5);

    if (!climatePoints || climatePoints.length === 0) {
      return null;
    }

    const distance = (lat: number, lon: number) =>
      Math.sqrt(Math.pow(lat - latitude, 2) + Math.pow(lon - longitude, 2));

    const closest = climatePoints.reduce((prev, curr) => {
      const prevDist = distance(Number(prev.latitude), Number(prev.longitude));
      const currDist = distance(Number(curr.latitude), Number(curr.longitude));
      return currDist < prevDist ? curr : prev;
    });

    const dist = distance(Number(closest.latitude), Number(closest.longitude));
    const confidenceAdjustment = Math.max(0.5, 1 - (dist * 10));

    return {
      zone: closest.hardiness_zone,
      confidence: Number(closest.confidence_score) * confidenceAdjustment,
      minTemp: Number(closest.min_temperature),
    };
  } catch (error) {
    console.error('Climate data lookup failed:', error);
    return null;
  }
}

export async function getMicroclimateAdjustments(
  latitude: number,
  longitude: number
): Promise<MicroclimateAdjustment[]> {
  try {
    const { data: factors } = await supabase
      .from('microclimate_factors')
      .select('*')
      .eq('is_active', true)
      .lte('latitude_min', latitude)
      .gte('latitude_max', latitude)
      .lte('longitude_min', longitude)
      .gte('longitude_max', longitude)
      .order('confidence_score', { ascending: false });

    if (!factors || factors.length === 0) {
      return [];
    }

    return factors.map(f => ({
      factor: f.factor_type,
      adjustment: Number(f.zone_adjustment),
      description: f.description || f.location_name,
      confidence: Number(f.confidence_score),
    }));
  } catch (error) {
    console.error('Microclimate factor lookup failed:', error);
    return [];
  }
}

export async function calculateEnhancedZone(
  baseZone: string,
  latitude: number,
  longitude: number,
  address?: string
): Promise<EnhancedZoneResult> {
  const adjustments: MicroclimateAdjustment[] = [];

  if (address) {
    const override = await checkZoneAdjustments(address, latitude, longitude);
    if (override) {
      return {
        baseZone,
        adjustedZone: override.zone,
        adjustments: [{
          factor: 'admin_override',
          adjustment: 0,
          description: 'Admin-verified zone',
          confidence: override.confidence,
        }],
        totalAdjustment: 0,
        confidence: override.confidence,
      };
    }
  }

  const climateData = await getClimateDataPoint(latitude, longitude);
  if (climateData && climateData.confidence > 0.80) {
    return {
      baseZone,
      adjustedZone: climateData.zone,
      adjustments: [{
        factor: 'climate_data',
        adjustment: 0,
        description: `Temperature data: ${climateData.minTemp.toFixed(1)}°C`,
        confidence: climateData.confidence,
      }],
      totalAdjustment: 0,
      confidence: climateData.confidence,
    };
  }

  const microclimateFactors = await getMicroclimateAdjustments(latitude, longitude);

  let totalAdjustment = 0;
  for (const factor of microclimateFactors) {
    adjustments.push(factor);
    totalAdjustment += factor.adjustment;
  }

  const adjustedZone = totalAdjustment !== 0 ? adjustZone(baseZone, totalAdjustment) : baseZone;

  const avgConfidence = adjustments.length > 0
    ? adjustments.reduce((sum, a) => sum + a.confidence, 0) / adjustments.length
    : 0.70;

  return {
    baseZone,
    adjustedZone,
    adjustments,
    totalAdjustment,
    confidence: Math.min(0.95, 0.70 + (avgConfidence * 0.25)),
  };
}

export function formatMicroclimateFactors(adjustments: MicroclimateAdjustment[]): string {
  if (adjustments.length === 0) return '';

  const factorNames: Record<string, string> = {
    urban_heat_island: 'Urban Heat',
    coastal_moderation: 'Coastal Effect',
    valley_pooling: 'Valley Cooling',
    lake_effect: 'Lake Moderation',
    wind_exposure: 'Wind Exposure',
    elevation: 'Elevation',
    admin_override: 'Verified',
    climate_data: 'Climate Data',
  };

  return adjustments
    .map(a => {
      const sign = a.adjustment > 0 ? '+' : '';
      const name = factorNames[a.factor] || a.factor;
      return `${name} (${sign}${a.adjustment.toFixed(1)})`;
    })
    .join(', ');
}
