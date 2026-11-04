import { supabase } from './supabase';
import { nominatimService } from './nominatimService';
import { getRegionNameFromZone } from './coordinateToZone';
import { detectZoneForLocation } from './zoneDetectionHelper';

export interface PostalCodeResult {
  id: string;
  postalCode: string;
  countryCode: string;
  cityName: string;
  latitude: number;
  longitude: number;
  zoneCode: string;
  regionName: string;
  confidenceScore: number;
  elevation?: number;
  dataSource?: string;
}

export async function searchPostalCode(postalCode: string, countryCode?: string): Promise<PostalCodeResult | null> {
  try {
    const cleanedPostalCode = postalCode.trim().replace(/\s+/g, '');

    const cachedResult = await searchCachedPostalCode(cleanedPostalCode);
    if (cachedResult) {
      await updateCacheAccess(cachedResult.id);
      return cachedResult;
    }

    const nominatimResult = await nominatimService.searchByPostalCode(cleanedPostalCode, countryCode);
    if (!nominatimResult) {
      return null;
    }

    const detection = await detectZoneForLocation(
      nominatimResult.latitude,
      nominatimResult.longitude,
      nominatimResult.cityName
    );

    const regionName = getRegionNameFromZone(detection.zone, nominatimResult.countryCode);

    const result: PostalCodeResult = {
      id: crypto.randomUUID(),
      postalCode: cleanedPostalCode,
      countryCode: nominatimResult.countryCode,
      cityName: nominatimResult.cityName,
      latitude: nominatimResult.latitude,
      longitude: nominatimResult.longitude,
      zoneCode: detection.zone,
      regionName: regionName || nominatimResult.regionName,
      confidenceScore: detection.confidence,
      elevation: detection.elevation,
      dataSource: detection.source,
    };

    await cachePostalCodeResult(result);

    return result;
  } catch (error) {
    console.error('Error searching postal code:', error);
    return null;
  }
}

export async function searchPostalCodeSuggestions(query: string, limit: number = 10): Promise<PostalCodeResult[]> {
  try {
    const cleanedQuery = query.trim().replace(/\s+/g, '');

    if (cleanedQuery.length < 2) {
      return [];
    }

    const { data, error } = await supabase
      .from('postal_code_zones')
      .select('*')
      .or(`postal_code.ilike.${cleanedQuery}%,city_name.ilike.%${cleanedQuery}%`)
      .order('access_count', { ascending: false })
      .order('postal_code')
      .limit(limit);

    if (error || !data) {
      return [];
    }

    if (data.length > 0) {
      return data.map((item) => {
        const regionName = getRegionNameFromZone(item.zone_code || '', item.country_code);
        return {
          id: item.id,
          postalCode: item.postal_code,
          countryCode: item.country_code,
          cityName: item.city_name || '',
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          zoneCode: item.zone_code || '',
          regionName: regionName || item.region_name || '',
          confidenceScore: Number(item.confidence_score) || 0.65,
          elevation: item.elevation ? Number(item.elevation) : undefined,
          dataSource: item.data_source || 'cache',
        };
      });
    }

    const nominatimResults = await nominatimService.searchByQuery(cleanedQuery);

    const detectionPromises = nominatimResults.slice(0, limit).map(async (nominatimResult) => {
      const detection = await detectZoneForLocation(
        nominatimResult.latitude,
        nominatimResult.longitude,
        nominatimResult.cityName,
        undefined,
        true
      );

      const regionName = getRegionNameFromZone(detection.zone, nominatimResult.countryCode);

      return {
        id: crypto.randomUUID(),
        postalCode: '',
        countryCode: nominatimResult.countryCode,
        cityName: nominatimResult.cityName,
        latitude: nominatimResult.latitude,
        longitude: nominatimResult.longitude,
        zoneCode: detection.zone,
        regionName: regionName || nominatimResult.regionName,
        confidenceScore: detection.confidence,
        elevation: detection.elevation,
        dataSource: detection.source,
      };
    });

    return await Promise.all(detectionPromises);
  } catch (error) {
    console.error('Error searching postal code suggestions:', error);
    return [];
  }
}

export async function getPlantsByZone(zoneCode: string, usageCategories?: string[]) {
  try {
    const zoneKey = `zone_${zoneCode.toLowerCase()}` as const;

    let query = supabase
      .from('plants_flat')
      .select('*')
      .eq(zoneKey, true);

    if (usageCategories && usageCategories.length > 0) {
      const orConditions: string[] = [];

      usageCategories.forEach(category => {
        // Map category names to database column names
        let dbColumn: string;

        if (category === 'hedge') {
          dbColumn = 'usage_formal_hedge';
        } else if (category === 'water_plants') {
          dbColumn = 'usage_waterplants_pond';
        } else if (category === 'perennials_ferns') {
          dbColumn = 'usage_ferns';
        } else if (category === 'perennials_grasses') {
          dbColumn = 'usage_grasses';
        } else if (category === 'perennials_climbing') {
          dbColumn = 'usage_climbing';
        } else if (category === 'perennials_medical_herbs') {
          dbColumn = 'usage_medicinal_herbs';
        } else if (category === 'perennials_ground_covers') {
          dbColumn = 'usage_ground_cover';
        } else if (category === 'perennials_seasonal') {
          dbColumn = 'usage_seasonal';
        } else if (category === 'perennials_tuberous_rooted') {
          dbColumn = 'usage_tuberous_rooted';
        } else {
          dbColumn = `usage_${category}`;
        }

        orConditions.push(`${dbColumn}.eq.true`);
      });

      if (orConditions.length > 0) {
        query = query.or(orConditions.join(','));
      }
    }

    const { data, error } = await query.order('botanical_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching plants by zone:', error);
    return [];
  }
}

export async function getStonesByRegion(zoneCode: string) {
  try {
    let regionFilter: string;

    const zoneNum = parseInt(zoneCode);
    if (zoneNum >= 9) {
      regionFilter = 'mediterranean_zone';
    } else if (zoneNum >= 7) {
      regionFilter = 'central_europe_zone';
    } else {
      regionFilter = 'alpine_zone';
    }

    const { data, error } = await supabase
      .from('stones')
      .select('*')
      .eq(regionFilter, true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching stones by region:', error);
    return [];
  }
}

async function searchCachedPostalCode(postalCode: string): Promise<PostalCodeResult | null> {
  const { data, error } = await supabase
    .from('postal_code_zones')
    .select('*')
    .eq('postal_code', postalCode)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const detection = await detectZoneForLocation(
    Number(data.latitude),
    Number(data.longitude),
    data.city_name || undefined
  );

  const regionName = getRegionNameFromZone(detection.zone, data.country_code);

  return {
    id: data.id,
    postalCode: data.postal_code,
    countryCode: data.country_code,
    cityName: data.city_name || '',
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    zoneCode: detection.zone,
    regionName: regionName || data.region_name || '',
    confidenceScore: detection.confidence,
    elevation: detection.elevation,
    dataSource: detection.source,
  };
}

async function updateCacheAccess(id: string): Promise<void> {
  try {
    await supabase
      .from('postal_code_zones')
      .update({ last_accessed: new Date().toISOString() })
      .eq('id', id);
  } catch (error) {
    console.error('Error updating cache access:', error);
  }
}

async function cachePostalCodeResult(result: PostalCodeResult): Promise<void> {
  try {
    await supabase
      .from('postal_code_zones')
      .insert({
        id: result.id,
        postal_code: result.postalCode,
        country_code: result.countryCode,
        city_name: result.cityName,
        latitude: result.latitude,
        longitude: result.longitude,
        zone_code: result.zoneCode,
        region_name: result.regionName,
        confidence_score: result.confidenceScore,
        data_source: 'nominatim',
        last_accessed: new Date().toISOString(),
        access_count: 1,
        is_verified: false,
      });
  } catch (error) {
    console.error('Error caching postal code result:', error);
  }
}
