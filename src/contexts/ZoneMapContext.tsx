import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Plant, Stone } from '../lib/supabase';
import { PostalCodeResult, getPlantsByZone, getStonesByRegion } from '../lib/postalCodeSearch';
import { PlantUsageCategory } from '../components/ZoneMap/UsageCategorySelector';
import { PlantCategory } from '../components/ZoneMap/PlantCategorySelector';
import { LatLngTuple } from 'leaflet';
import { findNearestPostalCode } from '../lib/reverseGeocode';
import { detectZoneForLocation } from '../lib/zoneDetectionHelper';
import { getRegionNameFromZone } from '../lib/coordinateToZone';

type SunExposure = 'sun' | 'shade' | 'halfshade';

interface ZoneMapContextType {
  selectedLocation: PostalCodeResult | null;
  mapCenter: LatLngTuple;
  mapZoom: number;
  plants: Plant[];
  stones: Stone[];
  loading: boolean;
  showResults: boolean;
  usageCategories: PlantUsageCategory[];
  plantCategories: PlantCategory[];
  sunExposures: SunExposure[];
  selectedColors: string[];
  activeTab: 'plants' | 'stones';
  selectionStep: 'usage' | 'category' | 'results';
  manualZone: string | null;
  handleLocationSelect: (result: PostalCodeResult) => Promise<void>;
  handleCloseResults: () => void;
  handleUsageFilterChange: (categories: PlantUsageCategory[]) => Promise<void>;
  handleMapClick: (lat: number, lng: number) => Promise<void>;
  handleManualZoneSelect: (zoneCode: string) => void;
  setUsageCategories: React.Dispatch<React.SetStateAction<PlantUsageCategory[]>>;
  setPlantCategories: React.Dispatch<React.SetStateAction<PlantCategory[]>>;
  setSunExposures: React.Dispatch<React.SetStateAction<SunExposure[]>>;
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveTab: React.Dispatch<React.SetStateAction<'plants' | 'stones'>>;
  setSelectionStep: React.Dispatch<React.SetStateAction<'usage' | 'category' | 'results'>>;
}

const ZoneMapContext = createContext<ZoneMapContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'zone-map-view-state';

const defaultCenter: LatLngTuple = [48.1351, 11.5820];
const defaultZoom = 6;

interface StoredState {
  selectedLocation: PostalCodeResult | null;
  mapCenter: LatLngTuple;
  mapZoom: number;
  usageCategories: PlantUsageCategory[];
  plantCategories: PlantCategory[];
  sunExposures: SunExposure[];
  selectedColors: string[];
  activeTab: 'plants' | 'stones';
  selectionStep: 'usage' | 'category' | 'results';
  showResults: boolean;
}

export const ZoneMapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState<PostalCodeResult | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngTuple>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [stones, setStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [usageCategories, setUsageCategories] = useState<PlantUsageCategory[]>([]);
  const [plantCategories, setPlantCategories] = useState<PlantCategory[]>([]);
  const [sunExposures, setSunExposures] = useState<SunExposure[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'plants' | 'stones'>('plants');
  const [selectionStep, setSelectionStep] = useState<'usage' | 'category' | 'results'>('usage');
  const [manualZone, setManualZone] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed: StoredState = JSON.parse(saved);
        if (parsed.selectedLocation) {
          setSelectedLocation(parsed.selectedLocation);
          setMapCenter(parsed.mapCenter || defaultCenter);
          setMapZoom(parsed.mapZoom || defaultZoom);
          setUsageCategories(parsed.usageCategories || []);
          setPlantCategories(parsed.plantCategories || []);
          setSunExposures(parsed.sunExposures || []);
          setSelectedColors(parsed.selectedColors || []);
          setActiveTab(parsed.activeTab || 'plants');
          setSelectionStep(parsed.selectionStep || 'usage');
          setShowResults(parsed.showResults || false);

          if (parsed.selectedLocation && parsed.showResults) {
            loadDataForLocation(parsed.selectedLocation, parsed.usageCategories || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading zone map view state:', error);
    }
  }, []);

  const loadDataForLocation = async (location: PostalCodeResult, categories: PlantUsageCategory[]) => {
    setLoading(true);
    try {
      const stonesData = await getStonesByRegion(location.zoneCode);
      setStones(stonesData);

      if (categories.length > 0) {
        const plantsData = await getPlantsByZone(location.zoneCode, categories);
        setPlants(plantsData);
      }
    } catch (error) {
      console.error('Error loading location data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const state: StoredState = {
        selectedLocation,
        mapCenter,
        mapZoom,
        usageCategories,
        plantCategories,
        sunExposures,
        selectedColors,
        activeTab,
        selectionStep,
        showResults,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving zone map view state:', error);
    }
  }, [
    selectedLocation,
    mapCenter,
    mapZoom,
    usageCategories,
    plantCategories,
    sunExposures,
    selectedColors,
    activeTab,
    selectionStep,
    showResults,
  ]);

  const handleLocationSelect = async (result: PostalCodeResult) => {
    setManualZone(null);
    setSelectedLocation(result);
    setMapCenter([result.latitude, result.longitude]);
    setMapZoom(12);
    setLoading(true);
    setShowResults(true);
    setUsageCategories([]);
    setPlantCategories([]);
    setSunExposures([]);
    setSelectedColors([]);
    setActiveTab('plants');
    setSelectionStep('usage');

    const stonesData = await getStonesByRegion(result.zoneCode);

    setPlants([]);
    setStones(stonesData);
    setLoading(false);
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setSelectedLocation(null);
    setManualZone(null);
    setUsageCategories([]);
    setPlantCategories([]);
    setSunExposures([]);
    setSelectedColors([]);
    setPlants([]);
    setActiveTab('plants');
    setSelectionStep('usage');
  };

  const handleUsageFilterChange = async (categories: PlantUsageCategory[]) => {
    const zoneCode = selectedLocation?.zoneCode || manualZone;
    if (!zoneCode) return;

    setUsageCategories(categories);
    setLoading(true);

    const plantsData = await getPlantsByZone(zoneCode, categories);

    setPlants(plantsData);
    setLoading(false);
  };

  const handleManualZoneSelect = async (zoneCode: string) => {
    if (!zoneCode) {
      setManualZone(null);
      setShowResults(false);
      setPlants([]);
      setStones([]);
      return;
    }
    setManualZone(zoneCode);
    setSelectedLocation(null);
    setLoading(true);
    setShowResults(true);
    setUsageCategories([]);
    setPlantCategories([]);
    setSunExposures([]);
    setSelectedColors([]);
    setActiveTab('plants');
    setSelectionStep('usage');

    try {
      const stonesData = await getStonesByRegion(zoneCode);
      setStones(stonesData);
      setPlants([]);
    } catch (error) {
      console.error('Error loading manual zone data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setLoading(true);

    const nearestLocation = await findNearestPostalCode(lat, lng);

    if (nearestLocation) {
      await handleLocationSelect(nearestLocation);
    } else {
      try {
        const detection = await detectZoneForLocation(lat, lng);
        const regionName = getRegionNameFromZone(detection.zone, '');
        const fallbackResult: PostalCodeResult = {
          id: crypto.randomUUID(),
          postalCode: '',
          countryCode: '',
          cityName: `Zone ${detection.zone}`,
          latitude: lat,
          longitude: lng,
          zoneCode: detection.zone,
          regionName: regionName || 'Coordinate-based',
          confidenceScore: detection.confidence,
          elevation: detection.elevation,
          dataSource: detection.source,
        };
        await handleLocationSelect(fallbackResult);
      } catch (err) {
        console.error('Zone detection failed for clicked location:', err);
        setLoading(false);
        alert('No postal code area found nearby. Please use the manual zone filter on the left.');
      }
    }
  };

  const value: ZoneMapContextType = {
    selectedLocation,
    mapCenter,
    mapZoom,
    plants,
    stones,
    loading,
    showResults,
    usageCategories,
    plantCategories,
    sunExposures,
    selectedColors,
    activeTab,
    selectionStep,
    manualZone,
    handleLocationSelect,
    handleCloseResults,
    handleUsageFilterChange,
    handleMapClick,
    handleManualZoneSelect,
    setUsageCategories,
    setPlantCategories,
    setSunExposures,
    setSelectedColors,
    setActiveTab,
    setSelectionStep,
  };

  return (
    <ZoneMapContext.Provider value={value}>
      {children}
    </ZoneMapContext.Provider>
  );
};

export const useZoneMap = () => {
  const context = useContext(ZoneMapContext);
  if (context === undefined) {
    throw new Error('useZoneMap must be used within a ZoneMapProvider');
  }
  return context;
};
