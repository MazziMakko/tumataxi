'use client';

import React, { useState } from 'react';
import { useDriverStore, useCurrentRideSession, useRideState } from '@/store/driverStore';
import SlideToConfirm from '@/components/ui/SlideToConfirm';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';

/**
 * PickupScreen (NAVIGATING_TO_PICKUP / ARRIVED_AT_PICKUP)
 * Turn-by-turn navigation with slide-to-confirm
 */
export default function PickupScreen({ mode = 'navigating' }: { mode?: 'navigating' | 'arrived' }) {
  const state = useRideState();
  const { arrivedAtPickup, riderOnBoard } = useDriverStore();
  const rideSession = useCurrentRideSession();
  const isArrived = mode === 'arrived' || state === 'ARRIVED_AT_PICKUP';
  const [mapExpanded, setMapExpanded] = useState(true);

  if (!rideSession) {
    return null;
  }

  const handleArrivedConfirm = () => {
    arrivedAtPickup();
  };

  const handleRiderOnBoardConfirm = () => {
    riderOnBoard();
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      {/* Map Area */}
      <div className={`relative bg-gray-700 transition-all duration-300 ${
        mapExpanded ? 'flex-1' : 'h-32'
      }`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">Navigation Map</div>
            <p className="text-gray-300 text-xs">MapLibre with turn-by-turn</p>
            {!mapExpanded && (
              <p className="text-gray-500 text-xs mt-1">
                📍 {rideSession.pickupAddress}
              </p>
            )}
          </div>
        </div>

        {/* Minimize/Expand Button */}
        <button
          onClick={() => setMapExpanded(!mapExpanded)}
          className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
        >
          {mapExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Content Card */}
      <div className="bg-gray-800 border-t border-gray-700 p-6 space-y-6">
        {/* State Indicator */}
        <div className={`text-center py-2 rounded-lg ${
          isArrived ? 'bg-blue-600/20 text-blue-400' : 'bg-green-600/20 text-green-400'
        }`}>
          <div className="text-sm font-semibold">
            {isArrived ? '✓ You have arrived' : '→ En route to pickup'}
          </div>
        </div>

        {/* Pickup Address */}
        <div className="space-y-2">
          <div className="text-gray-400 text-xs font-medium uppercase">Pickup Location</div>
          <div className="text-white text-lg font-bold">{rideSession.pickupAddress}</div>
          <div className="text-gray-400 text-sm">
            📍 {rideSession.estimatedDistanceKm.toFixed(1)} km away
          </div>
        </div>

        {/* Trip Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">Estimated Fare</div>
            <div className="text-green-400 font-bold text-lg">
              {formatCurrencyMZN(rideSession.estimatedFareMZN)}
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">ETA</div>
            <div className="text-white font-bold text-lg">
              ~{rideSession.estimatedDurationMin} min
            </div>
          </div>
        </div>

        {/* Rider Info */}
        <div className="bg-gray-700 rounded-lg p-3 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {rideSession.riderName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="text-white font-medium text-sm">{rideSession.riderName}</div>
            <div className="text-gray-400 text-xs">⭐ {rideSession.riderRating.toFixed(1)}</div>
          </div>
        </div>

        {/* Navigation Button */}
        {!isArrived && (
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors duration-200">
            📍 Open in Maps (Google/Waze)
          </button>
        )}

        {/* Main Action - Slide to Confirm */}
        {isArrived ? (
          <SlideToConfirm
            label="Start Trip"
            onConfirm={handleRiderOnBoardConfirm}
            color="green"
          />
        ) : (
          <SlideToConfirm
            label="I've Arrived"
            onConfirm={handleArrivedConfirm}
            color="blue"
          />
        )}

        {/* Helper Text */}
        <p className="text-gray-400 text-xs text-center">
          {isArrived
            ? 'Waiting for passenger? Swipe to start the trip.'
            : 'Drive to pickup location. Swipe when you arrive.'}
        </p>
      </div>
    </div>
  );
}
