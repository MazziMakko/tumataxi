'use client';

import { useState, useCallback } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';

// Maputo City Center
const MAPUTO = { lat: -25.9692, lng: 32.5732 };

const RIDE_TYPES = [
  { id: 'ECONOMY', title: 'Economia', price: 150, icon: '🚗' },
  { id: 'TAXI', title: 'Conforto', price: 220, icon: '🚕' },
  { id: 'BODA', title: 'Boda', price: 80, icon: '🏍️' },
];

export default function RideMapPage() {
  const [destination, setDestination] = useState('');
  const [showSelector, setShowSelector] = useState(false);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [pickup, setPickup] = useState(MAPUTO);

  const onMarkerDragEnd = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
    setPickup({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  }, []);

  return (
    <div className="h-screen w-screen relative bg-white overflow-hidden">
      <Map
        initialViewState={{
          longitude: MAPUTO.lng,
          latitude: MAPUTO.lat,
          zoom: 13,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        <Marker
          longitude={pickup.lng}
          latitude={pickup.lat}
          anchor="bottom"
          draggable
          onDragEnd={onMarkerDragEnd}
        >
          <div
            className="w-14 h-14 rounded-full bg-primary border-4 border-white shadow-lg cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
            style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}
          >
            <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
        </Marker>
      </Map>

      {/* Fixed bottom nav - does not scroll */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-10">
        <input
          type="text"
          placeholder="Para onde?"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onFocus={() => setShowSelector(false)}
          className="w-full px-4 py-4 border border-gray-200 rounded-xl text-lg mb-4 focus:ring-2 focus:ring-primary focus:border-transparent"
        />

        {destination && !showSelector && (
          <button
            onClick={() => setShowSelector(true)}
            className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-600 transition-colors"
          >
            Ver opções de viagem
          </button>
        )}

        {showSelector && (
          <div className="space-y-2 mb-4">
            <p className="text-gray-600 text-sm font-medium">Escolha o tipo de viagem</p>
            {RIDE_TYPES.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRide(r.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 ${
                  selectedRide === r.id ? 'border-primary bg-primary/10' : 'border-gray-200'
                }`}
              >
                <span className="text-2xl">{r.icon}</span>
                <span className="font-medium">{r.title}</span>
                <span className="text-black font-semibold">{formatCurrencyMZN(r.price)}</span>
              </button>
            ))}
            <button
              onClick={() => selectedRide && alert('Viagem solicitada! (Demo)')}
              disabled={!selectedRide}
              className="w-full py-4 bg-primary text-black font-bold rounded-xl disabled:opacity-50 hover:bg-primary-600 transition-colors"
            >
              Pedir viagem {selectedRide ? `— ${RIDE_TYPES.find((x) => x.id === selectedRide)?.title}` : '...'}
            </button>
          </div>
        )}
      </div>

      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
        <h1 className="text-lg font-bold text-black">Tuma Taxi</h1>
      </div>
    </div>
  );
}
