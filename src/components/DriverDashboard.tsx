/**
 * DRIVER DASHBOARD - Tuma Taxi
 * PWA for Mozambique drivers | 3G-optimized | Dark mode | One-hand UI
 *
 * Features:
 * - Fullscreen MapLibre (via react-map-gl)
 * - Earnings HUD + Tier progress meter
 * - Go Online/Offline pill button
 * - Ride request bottom sheet (swipeable)
 * - Offline detection with red banner
 * - Rulial Logic tier integration (BRONZE/SILVER/GOLD)
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import Map, { GeolocateControl } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDriverStore } from '@/store/driverStore';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';
import { validateTierEligibility } from '@/lib/rulial/commission';

// ============================================================================
// TYPES
// ============================================================================

interface RideRequest {
  id: string;
  pickupLat: number;
  pickupLon: number;
  pickupAddress: string;
  dropoffAddress: string;
  estimatedFareMZN: number;
  estimatedDurationMin: number;
  estimatedDistanceKm: number;
  riderName: string;
  riderRating: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const DriverDashboard: React.FC = () => {
  // State
  const mapRef = useRef(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(null);
  const [todayEarnings] = useState(0);
  const [activityScore] = useState(65);

  // Driver store
  const driverTier = useDriverStore((s) => s.stats.currentTier);
  const weeklyRides = useDriverStore((s) => s.stats.totalRidesThisWeek);
  const rating = useDriverStore((s) => s.stats.averageRating);

  // Network detection
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsConnected(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Open sheet when ride arrives
  useEffect(() => {
    if (currentRide) {
      setSheetOpen(true);
    }
  }, [currentRide]);

  // Get tier progression
  const tierEligibility = validateTierEligibility({
    currentTier: driverTier,
    weeklyRidesCompleted: weeklyRides,
    totalRidesCompleted: weeklyRides * 4, // Estimate total from weekly
    rating,
  });

  const tierData = {
    BRONZE: { label: '🥉 Bronze', percentage: 0 },
    SILVER: { label: '🥈 Prata', percentage: 50 },
    GOLD: { label: '🏆 Ouro', percentage: 100 },
  };

  const currentTierData = tierData[driverTier as keyof typeof tierData];

  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden">
      {/* =============================================================== */}
      {/* OFFLINE BANNER */}
      {/* =============================================================== */}
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50 text-sm font-bold">
          ⚠️ Conexão Perdida — Modo Espera
        </div>
      )}

      {/* =============================================================== */}
      {/* MAP (Full screen) */}
      {/* =============================================================== */}
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          initialViewState={{
            latitude: -25.9692,
            longitude: 32.5732,
            zoom: 12,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://tiles.stadiamaps.com/styles/stamen_toner_background.json"
        >
          <GeolocateControl position="bottom-right" />
        </Map>

        {/* ============================================================== */}
        {/* HUD OVERLAY (Top-left: Earnings + Activity) */}
        {/* ============================================================== */}
        <div className="absolute top-4 left-4 space-y-2 z-10">
          {/* Earnings */}
          <div className="bg-black bg-opacity-75 border border-green-500 rounded-lg px-4 py-2 backdrop-blur-sm">
            <p className="text-xs text-gray-400 font-semibold">GANHOS HOJE</p>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrencyMZN(todayEarnings)}
            </p>
          </div>

          {/* Activity Score */}
          <div className="bg-black bg-opacity-75 border border-blue-500 rounded-lg px-4 py-2 backdrop-blur-sm">
            <p className="text-xs text-gray-400 font-semibold">SCORE</p>
            <p className="text-xl font-bold text-blue-400">{activityScore}%</p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TIER PROGRESS (Top-right) */}
        {/* ============================================================== */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-75 border border-purple-500 rounded-lg px-4 py-2 backdrop-blur-sm w-44 z-10">
          <p className="text-xs text-gray-400 font-semibold mb-1">RANK</p>
          <p className="text-lg font-bold text-purple-400 mb-2">{currentTierData.label}</p>

          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${currentTierData.percentage}%` }}
            />
          </div>

          {/* Next tier info */}
          <p className="text-xs text-gray-300">
            {!tierEligibility.isEligibleForGold
              ? `${tierEligibility.nextMilestones[0] || 'Próximo nível'}`
              : '✓ Máximo Nível'}
          </p>
        </div>
      </div>

      {/* =============================================================== */}
      {/* GO ONLINE / GO OFFLINE BUTTON (Center bottom) */}
      {/* =============================================================== */}
      <div className="flex justify-center pb-6 px-4 z-20">
        <button
          onClick={() => setIsOnline(!isOnline)}
          disabled={!isConnected}
          className={`
            w-full max-w-xs py-4 px-6 rounded-full font-bold text-lg
            transition-all duration-200 touch-none
            active:scale-95
            ${
              isOnline
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
            }
            ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'active:shadow-inner'}
          `}
        >
          {isOnline ? '⏸ FICAR OFFLINE' : '▶ FICAR ONLINE'}
        </button>
      </div>

      {/* =============================================================== */}
      {/* BOTTOM SHEET (Ride request) */}
      {/* =============================================================== */}
      {sheetOpen && currentRide && (
        <RideRequestBottomSheet
          ride={currentRide}
          onAccept={() => {
            setCurrentRide(null);
            setSheetOpen(false);
          }}
          onDecline={() => {
            setCurrentRide(null);
            setSheetOpen(false);
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// RIDE REQUEST BOTTOM SHEET (Minimal, swipeable)
// ============================================================================

interface RideRequestBottomSheetProps {
  ride: RideRequest;
  onAccept: () => void;
  onDecline: () => void;
}

const RideRequestBottomSheet: React.FC<RideRequestBottomSheetProps> = ({
  ride,
  onAccept,
  onDecline,
}) => {
  const [startY, setStartY] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startY;
    if (delta > 0) {
      setOffsetY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (offsetY > 80) {
      onDecline();
    }
    setOffsetY(0);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-30"
        onClick={onDecline}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl z-40 transform transition-transform"
        style={{ transform: `translateY(${offsetY}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-5 pb-8 space-y-5">
          {/* Header */}
          <div>
            <p className="text-2xl font-bold text-white mb-1">🚗 Nova Viagem</p>
            <p className="text-gray-400 text-sm">Swipe para rejeitar</p>
          </div>

          {/* Rider info */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <p className="text-lg font-bold text-white">{ride.riderName}</p>
            <p className="text-yellow-400 text-sm">⭐ {ride.riderRating}</p>
          </div>

          {/* Route */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-400 font-semibold">BUSCA</p>
              <p className="text-white font-semibold">{ride.pickupAddress}</p>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <p className="text-xs text-gray-400 font-semibold">DESTINO</p>
              <p className="text-white font-semibold">{ride.dropoffAddress}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">DISTÂNCIA</p>
              <p className="text-white font-bold text-lg">
                {ride.estimatedDistanceKm} km
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">TEMPO</p>
              <p className="text-white font-bold text-lg">
                {ride.estimatedDurationMin} min
              </p>
            </div>
            <div className="bg-green-900 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">GANHO</p>
              <p className="text-green-400 font-bold text-lg">
                {formatCurrencyMZN(ride.estimatedFareMZN)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={onDecline}
              className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors"
            >
              ✕ Rejeitar
            </button>
            <button
              onClick={onAccept}
              className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors active:scale-95"
            >
              ✓ Aceitar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DriverDashboard;
