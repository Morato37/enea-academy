import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, useMapEvents } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PostalCodeSearch } from '../components/ZoneMap/PostalCodeSearch';
import { ZoneLegend } from '../components/ZoneMap/ZoneLegend';
import { ResultsPanel } from '../components/ZoneMap/ResultsPanel';
import { getZoneColor, getZoneLabel } from '../lib/zoneColors';
import { Loader2, Info } from 'lucide-react';
import { LayerDistribution } from '../components/LayerDistribution';
import { useZoneMap } from '../contexts/ZoneMapContext';

const defaultCenter: LatLngTuple = [48.1351, 11.5820];
const defaultZoom = 6;

const MapController: React.FC<{ center: LatLngTuple; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const ZoneMapPage: React.FC = () => {
  const {
    selectedLocation,
    mapCenter,
    mapZoom,
    plants,
    stones,
    loading,
    showResults,
    handleLocationSelect,
    handleCloseResults,
    handleUsageFilterChange,
    handleMapClick,
  } = useZoneMap();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="bg-cyan-600 border-b border-cyan-700 p-3 md:p-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 md:gap-4">
            <div className="flex-shrink-0 w-full lg:w-auto">
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Hardiness Zone Explorer</h1>
              <p className="text-xs md:text-sm text-white/90">
                Find suitable plants and stones for your region
              </p>
            </div>
            <div className="flex-1 w-full max-w-2xl">
              <PostalCodeSearch onLocationSelect={handleLocationSelect} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          className="h-full w-full"
          zoomControl={true}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <MapClickHandler onMapClick={handleMapClick} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {selectedLocation && (
            <>
              <CircleMarker
                center={[selectedLocation.latitude, selectedLocation.longitude]}
                radius={20}
                pathOptions={{
                  color: getZoneColor(selectedLocation.zoneCode),
                  fillColor: getZoneColor(selectedLocation.zoneCode),
                  fillOpacity: 0.3,
                  weight: 3,
                }}
              />
              <Marker
                position={[selectedLocation.latitude, selectedLocation.longitude]}
                icon={new Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                })}
              >
                <Popup>
                  <div className="p-2">
                    <div className="font-semibold text-lg mb-1">
                      {selectedLocation.cityName}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      PLZ: {selectedLocation.postalCode}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: getZoneColor(selectedLocation.zoneCode) }}
                      />
                      <span className="text-sm font-medium">
                        {getZoneLabel(selectedLocation.zoneCode)}
                      </span>
                    </div>
                    {selectedLocation.elevation && (
                      <div className="text-xs text-gray-600 mt-1">
                        Elevation: {Math.round(selectedLocation.elevation)}m
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Confidence: {Math.round(selectedLocation.confidenceScore * 100)}%
                      {selectedLocation.dataSource && ` (${selectedLocation.dataSource})`}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {plants.length} plants, {stones.length} stones available
                    </div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>

        <div className="absolute top-4 left-4 z-[1000] w-56 md:w-72 hidden sm:block space-y-4">
          <ZoneLegend />
          <LayerDistribution />
        </div>

        {!selectedLocation && (
          <div className="absolute bottom-8 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-[1000] bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-lg px-4 md:px-6 py-3 md:py-4 shadow-2xl md:max-w-md">
            <div className="flex items-start gap-2 md:gap-3">
              <Info className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-1 text-sm md:text-base">
                  Select Location
                </p>
                <p className="text-xs md:text-sm text-gray-400">
                  Click on the map or enter a postal code to find suitable plants and stones for your hardiness zone.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1001]">
            <div className="bg-zinc-900 rounded-lg p-6 flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              <span className="text-white">Loading data...</span>
            </div>
          </div>
        )}

        {showResults && selectedLocation && (
          <ResultsPanel
            plants={plants}
            stones={stones}
            zoneCode={selectedLocation.zoneCode}
            cityName={selectedLocation.cityName}
            onClose={handleCloseResults}
            onUsageFilterChange={handleUsageFilterChange}
          />
        )}
      </div>
    </div>
  );
};
