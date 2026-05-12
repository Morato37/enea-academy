interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
    country_code?: string;
    state?: string;
    county?: string;
    region?: string;
  };
  boundingbox?: string[];
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  cityName: string;
  countryCode: string;
  regionName: string;
  displayName: string;
}

class NominatimService {
  private static instance: NominatimService;
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 1100;
  private readonly API_BASE = 'https://nominatim.openstreetmap.org';
  private requestQueue: Array<() => void> = [];
  private isProcessingQueue: boolean = false;

  private constructor() {}

  static getInstance(): NominatimService {
    if (!NominatimService.instance) {
      NominatimService.instance = new NominatimService();
    }
    return NominatimService.instance;
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        await this.waitForRateLimit();
        nextRequest();
      }
    }

    this.isProcessingQueue = false;
  }

  private enqueueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  async searchByPostalCode(postalCode: string, countryCode?: string): Promise<GeocodingResult | null> {
    return this.enqueueRequest(async () => {
      try {
        const params = new URLSearchParams({
          postalcode: postalCode,
          format: 'json',
          addressdetails: '1',
          limit: '1',
        });

        if (countryCode) {
          params.append('countrycodes', countryCode.toLowerCase());
        }

        const response = await fetch(`${this.API_BASE}/search?${params.toString()}`, {
          headers: {
            'User-Agent': 'EneaSeedApp/1.0 (Plant Hardiness Zone Application)',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data: NominatimResponse[] = await response.json();

        if (!data || data.length === 0) {
          return null;
        }

        const result = data[0];

        return this.parseNominatimResponse(result);
      } catch (error) {
        console.error('Error fetching from Nominatim:', error);
        return null;
      }
    });
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    return this.enqueueRequest(async () => {
      try {
        const params = new URLSearchParams({
          lat: latitude.toString(),
          lon: longitude.toString(),
          format: 'json',
          addressdetails: '1',
          zoom: '10',
        });

        const response = await fetch(`${this.API_BASE}/reverse?${params.toString()}`, {
          headers: {
            'User-Agent': 'EneaSeedApp/1.0 (Plant Hardiness Zone Application)',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data: NominatimResponse = await response.json();

        if (!data) {
          return null;
        }

        return this.parseNominatimResponse(data);
      } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
      }
    });
  }

  async searchByQuery(query: string): Promise<GeocodingResult[]> {
    return this.enqueueRequest(async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '8',
        });

        const europeanCountries = [
          'de', 'at', 'ch', 'it', 'fr', 'es', 'pt', 'nl', 'be', 'lu',
          'gb', 'ie', 'dk', 'se', 'no', 'fi', 'is', 'pl', 'cz', 'sk',
          'hu', 'ro', 'bg', 'gr', 'hr', 'si', 'rs', 'ba', 'me', 'mk',
          'al', 'ee', 'lv', 'lt', 'ua', 'by', 'md', 'tr', 'cy', 'mt'
        ];

        params.append('countrycodes', europeanCountries.join(','));

        const response = await fetch(`${this.API_BASE}/search?${params.toString()}`, {
          headers: {
            'User-Agent': 'EneaSeedApp/1.0 (Plant Hardiness Zone Application)',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data: NominatimResponse[] = await response.json();

        return data
          .map(item => this.parseNominatimResponse(item))
          .filter((item): item is GeocodingResult => item !== null);
      } catch (error) {
        console.error('Error fetching from Nominatim:', error);
        return [];
      }
    });
  }

  private parseNominatimResponse(result: NominatimResponse): GeocodingResult | null {
    try {
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        return null;
      }

      if (latitude < 35 || latitude > 71 || longitude < -10 || longitude > 50) {
        return null;
      }

      const address = result.address || {};

      // Prefer the most specific location name (village > town > city > municipality)
      const cityName = address.village || address.town || address.city || address.municipality || '';
      const countryCode = (address.country_code || '').toUpperCase();
      const regionName = address.state || address.county || address.region || '';

      return {
        latitude,
        longitude,
        cityName,
        countryCode,
        regionName,
        displayName: result.display_name,
      };
    } catch (error) {
      console.error('Error parsing Nominatim response:', error);
      return null;
    }
  }
}

export const nominatimService = NominatimService.getInstance();
export type { GeocodingResult };
