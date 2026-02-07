/**
 * MapView Component
 * react-map-gl with MapLibre GL JS
 * Dark mode, high contrast, centered on Maputo
 * Shows driver location, available rides, real-time updates
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDriverStore, useDriverLocation } from '@/store/driverStore';

// ============================================================================
// TYPES
// ============================================================================

interface MapViewProps {
  onMapLoad?: () => void;
}

interface PopupInfo {
  type: 'driver' | 'ride';
  lat: number;
  lon: number;
}

interface MapStyle {
  light: string;
  dark: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAPBOX_STYLES: MapStyle = {
  light:
    'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
};

const MAPUTO_CENTER = {
  latitude: -25.9692,
  longitude: 32.5732,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const MapView: React.FC<MapViewProps> = ({ onMapLoad }) => {
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  // Store selectors
  const { lat: driverLat, lon: driverLon } = useDriverLocation();
  const isOnline = useDriverStore((s) => s.state !== 'OFFLINE');

  const [viewState, setViewState] = useState({
    longitude: MAPUTO_CENTER.longitude,
    latitude: MAPUTO_CENTER.latitude,
    zoom: 13,
    bearing: 0,
    pitch: 0,
  });

  // =========================================================================
  // UPDATE VIEW WHEN DRIVER LOCATION CHANGES
  // =========================================================================
  useEffect(() => {
    if (driverLat && driverLon && isOnline) {
      // Smoothly pan to driver location
      setViewState((prev) => ({
        ...prev,
        latitude: driverLat,
        longitude: driverLon,
      }));
    }
  }, [driverLat, driverLon, isOnline]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="relative w-full h-full bg-black">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_STYLES.dark}
        onLoad={onMapLoad}
        attributionControl={false}
      >
        {/* ================================================================ */}
        {/* DRIVER LOCATION MARKER */}
        {/* ================================================================ */}
        {driverLat && driverLon && isOnline && (
          <Marker
            latitude={driverLat}
            longitude={driverLon}
            anchor="center"
            onClick={() =>
              setPopupInfo({
                type: 'driver',
                lat: driverLat,
                lon: driverLon,
              })
            }
          >
            <div className="relative">
              {/* Pulsing outer ring (online indicator) */}
              <div className="absolute inset-0 w-10 h-10 bg-green-500 rounded-full opacity-30 animate-pulse"></div>

              {/* Driver marker */}
              <div className="relative w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
            </div>
          </Marker>
        )}

        {/* ================================================================ */}
        {/* RIDE REQUEST PICKUP LOCATION */}
        {/* ================================================================ */}
        {/* TODO: Add ride request pickup marker when ride data is available */}

        {/* ================================================================ */}
        {/* RIDE REQUEST DROPOFF LOCATION */}
        {/* ================================================================ */}
        {/* TODO: Add ride request dropoff marker when ride data is available */}

        {/* ================================================================ */}
        {/* POPUP TOOLTIP */}
        {/* ================================================================ */}
        {popupInfo && (
          <Popup
            latitude={(popupInfo as any).latitude || (popupInfo as any).lat}
            longitude={(popupInfo as any).longitude || (popupInfo as any).lon}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            anchor="bottom"
          >
            <div className="bg-gray-900 text-white p-2 rounded text-xs">
              {(popupInfo as any).type === 'driver' && <p>Your Location</p>}
              {(popupInfo as any).type === 'pickup' && (
                <div>
                  <p className="font-bold">Pickup</p>
                  <p>{(popupInfo as any).pickupAddress}</p>
                </div>
              )}
              {(popupInfo as any).type === 'dropoff' && (
                <div>
                  <p className="font-bold">Dropoff</p>
                  <p>{(popupInfo as any).dropoffAddress}</p>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* ================================================================== */}
      {/* MAP ATTRIBUTION */}
      {/* ================================================================== */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-gray-900 bg-opacity-60 px-2 py-1 rounded">
        © CartoDB © OpenStreetMap
      </div>
    </div>
  );
};
