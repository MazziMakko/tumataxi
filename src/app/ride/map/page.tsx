'use client';

import { useState } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPUTO = { lat: -25.9692, lng: 32.5732 };
const RIDE_TYPES = [
  { id: 'ECONOMY', title: 'Economy', price: 150, icon: '🚗' },
  { id: 'TAXI', title: 'Comfort', price: 220, icon: '🚕' },
  { id: 'BODA', title: 'Boda', price: 80, icon: '🏍️' },
];

export default function RideMapPage() {
  const [destination, setDestination] = useState('');
  const [showSelector, setShowSelector] = useState(false);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [pickup] = useState(MAPUTO);

  return (
    <div className="h-screen w-screen relative bg-white">
      <Map
        initialViewState={{
          longitude: MAPUTO.lng,
          latitude: MAPUTO.lat,
          zoom: 13,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        <Marker longitude={pickup.lng} latitude={pickup.lat} anchor="bottom">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow" />
        </Marker>
      </Map>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white rounded-t-3xl shadow-lg">
        <input
          type="text"
          placeholder="Para onde?"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onFocus={() => setShowSelector(false)}
          className="w-full px-4 py-4 border border-gray-200 rounded-xl text-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {destination && !showSelector && (
          <button
            onClick={() => setShowSelector(true)}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl"
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
                  selectedRide === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <span className="text-2xl">{r.icon}</span>
                <span className="font-medium">{r.title}</span>
                <span className="text-green-600 font-semibold">{r.price} MZN</span>
              </button>
            ))}
            <button
              onClick={() => selectedRide && alert('Viagem solicitada! (Demo)')}
              disabled={!selectedRide}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              Pedir {selectedRide || '...'}
            </button>
          </div>
        )}
      </div>

      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-900">Tuma Taxi</h1>
      </div>
    </div>
  );
}
