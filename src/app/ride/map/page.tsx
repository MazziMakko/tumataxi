'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';

// Maputo City Center — Rulial defaults
const MAPUTO = { lat: -25.9692, lng: 32.5732 };
const MAPUTO_DROPOFF = { lat: -25.9732, lng: 32.5792 };

const RIDE_TYPES = [
  { id: 'ECONOMY', title: 'Economia', price: 150, icon: '🚗' },
  { id: 'TAXI', title: 'Conforto', price: 220, icon: '🚕' },
  { id: 'BODA', title: 'Boda', price: 80, icon: '🏍️' },
];

const POLL_INTERVAL_MS = 5000;

export default function RideMapPage() {
  const [destination, setDestination] = useState('');
  const [showSelector, setShowSelector] = useState(false);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [pickup, setPickup] = useState(MAPUTO);
  const [requesting, setRequesting] = useState(false);
  const [searchingRideId, setSearchingRideId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onMarkerDragEnd = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
    setPickup({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  }, []);

  // Poll ride status every 5s when waiting for a driver
  useEffect(() => {
    if (!searchingRideId) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    const poll = async () => {
      try {
        const res = await fetch(`/api/ride/status?id=${encodeURIComponent(searchingRideId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'MATCHED' || data.status === 'IN_PROGRESS' || data.status === 'COMPLETED') {
          setSearchingRideId(null);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          if (data.status === 'MATCHED' && data.driver) {
            alert(`Motorista a caminho: ${data.driver.firstName} ${data.driver.lastName}`);
          }
        }
      } catch {
        // ignore
      }
    };
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [searchingRideId]);

  async function handleRequestRide() {
    if (!selectedRide || requesting) return;
    setRequestError(null);
    setRequesting(true);
    try {
      const selected = RIDE_TYPES.find((x) => x.id === selectedRide);
      const res = await fetch('/api/ride/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropLat: MAPUTO_DROPOFF.lat,
          dropLng: MAPUTO_DROPOFF.lng,
          price: selected?.price ?? 150,
          vehicleType: selected?.id ?? 'ECONOMY',
          pickupAddress: 'Maputo, Centro',
          dropoffAddress: destination || 'Maputo, Destino',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRequestError(data.error || 'Erro ao solicitar viagem.');
        setRequesting(false);
        return;
      }
      if (data.rideId) {
        setSearchingRideId(data.rideId);
        setShowSelector(false);
        setSelectedRide(null);
        setDestination('');
      }
    } finally {
      setRequesting(false);
    }
  }

  const showSearchingOverlay = !!searchingRideId;

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

      {/* Searching for drivers overlay — bottom sheet */}
      {showSearchingOverlay && (
        <div className="absolute inset-0 z-20 flex items-end justify-center pointer-events-none">
          <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] p-6 pb-10 pointer-events-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 0 11 18 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-black mb-1">A procurar motoristas...</h2>
              <p className="text-gray-500 text-sm">Assim que um motorista aceitar, será notificado.</p>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom nav - does not scroll */}
      {!showSearchingOverlay && (
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
              {requestError && <p className="text-red-500 text-sm">{requestError}</p>}
              <button
                onClick={handleRequestRide}
                disabled={!selectedRide || requesting}
                className="w-full py-4 bg-primary text-black font-bold rounded-xl disabled:opacity-50 hover:bg-primary-600 transition-colors"
              >
                {requesting ? 'A solicitar...' : `Pedir viagem ${selectedRide ? `— ${RIDE_TYPES.find((x) => x.id === selectedRide)?.title}` : '...'}`}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
        <h1 className="text-lg font-bold text-black">Tuma Taxi</h1>
      </div>
    </div>
  );
}
