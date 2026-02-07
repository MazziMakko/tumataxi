'use client';

import React, { useState } from 'react';
import { useDriverStore, useCurrentRideSession } from '@/store/driverStore';
import SlideToConfirm from '@/components/ui/SlideToConfirm';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';

/**
 * TripScreen (RIDE_IN_PROGRESS / ARRIVED_AT_DESTINATION)
 * Minimalist interface showing destination
 */
export default function TripScreen({ mode = 'progress' }: { mode?: 'progress' | 'destination' }) {
  const { arrivedAtDestination } = useDriverStore();
  const rideSession = useCurrentRideSession();
  const isArrived = mode === 'destination';
  const [mapExpanded, setMapExpanded] = useState(true);

  if (!rideSession) {
    return null;
  }

  const handleArrivedDestination = () => {
    arrivedAtDestination();
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      {/* Map Area */}
      <div className={`relative bg-gray-700 transition-all duration-300 ${
        mapExpanded ? 'flex-1' : 'h-32'
      }`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">Live Navigation</div>
            <p className="text-gray-300 text-xs">En route to destination</p>
            {!mapExpanded && (
              <p className="text-gray-500 text-xs mt-1">
                🎯 {rideSession.dropoffAddress}
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

        {/* Top Bar - Passenger & Ride Info */}
        <div className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                {rideSession.riderName.charAt(0)}
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{rideSession.riderName}</div>
                <div className="text-gray-400 text-xs">⭐ {rideSession.riderRating.toFixed(1)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-xs">Est. Fare</div>
              <div className="text-green-400 font-bold">{formatCurrencyMZN(rideSession.estimatedFareMZN)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Destination Card */}
      <div className="bg-gray-800 border-t border-gray-700 p-6 space-y-6">
        {/* Status */}
        <div className={`text-center py-2 rounded-lg ${
          isArrived ? 'bg-blue-600/20 text-blue-400' : 'bg-green-600/20 text-green-400'
        }`}>
          <div className="text-sm font-semibold">
            {isArrived ? '✓ You have arrived' : '🚗 Ride in Progress'}
          </div>
        </div>

        {/* Large Destination Text */}
        <div className="space-y-2">
          <div className="text-gray-400 text-xs font-medium uppercase">Destination</div>
          <div className="text-white text-2xl font-bold leading-tight">
            {rideSession.dropoffAddress}
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-gray-400 text-xs mb-1">Distance</div>
            <div className="text-white font-bold text-lg">
              {rideSession.estimatedDistanceKm.toFixed(1)} km
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-gray-400 text-xs mb-1">Duration</div>
            <div className="text-white font-bold text-lg">
              ~{rideSession.estimatedDurationMin} min
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-gray-400 text-xs mb-1">Status</div>
            <div className={`font-bold text-lg ${isArrived ? 'text-blue-400' : 'text-green-400'}`}>
              {isArrived ? '📍 Arrived' : '🟢 Active'}
            </div>
          </div>
        </div>

        {/* Main Action - Slide to Finish */}
        <SlideToConfirm
          label={isArrived ? "Complete Trip" : "Finish Trip"}
          onConfirm={handleArrivedDestination}
          color={isArrived ? "blue" : "green"}
        />

        {/* Helper Text */}
        <p className="text-gray-400 text-xs text-center">
          When you reach the destination, swipe to complete the trip.
        </p>
      </div>
    </div>
  );
}
