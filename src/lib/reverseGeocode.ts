import { PostalCodeResult } from './postalCodeSearch';
import { nominatimService } from './nominatimService';
import { getRegionNameFromZone } from './coordinateToZone';
import { detectZoneForLocation } from './zoneDetectionHelper';

export async function findNearestPostalCode(
  latitude: number,
  longitude: number
): Promise<PostalCodeResult | null> {
  try {
    const nominatimResult = await nominatimService.reverseGeocode(latitude, longitude);

    if (!nominatimResult) {
      return null;
    }

    const detection = await detectZoneForLocation(
      nominatimResult.latitude,
      nominatimResult.longitude,
      nominatimResult.cityName
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
  } catch (error) {
    console.error('Error finding nearest postal code:', error);
    return null;
  }
}
