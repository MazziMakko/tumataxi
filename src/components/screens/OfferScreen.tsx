'use client';

import React, { useEffect, useState } from 'react';
import { useDriverStore, useCurrentRideSession, useOfferCountdown } from '@/store/driverStore';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';

/**
 * OfferScreen (OFFER_RECEIVED)
 * Bottom sheet modal with offer details and circular timer
 */
export default function OfferScreen() {
  const { acceptOffer, rejectOffer, stats } = useDriverStore();
  const rideSession = useCurrentRideSession();
  const countdown = useOfferCountdown();
  const [circleProgress, setCircleProgress] = useState(100);

  useEffect(() => {
    // Calculate circle progress (30 seconds = 100%)
    const progress = (countdown / 30) * 100;
    setCircleProgress(progress);
  }, [countdown]);

  if (!rideSession) {
    return null; // Should not happen
  }

  const timerColor =
    countdown > 15 ? 'text-green-400' :
    countdown > 5 ? 'text-yellow-400' :
    'text-red-500';

  return (
    <div className="w-full h-screen bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      {/* Background Blur */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80" />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Circular Timer */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            {/* Background circle */}
            <svg className="absolute inset-0" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="55"
                fill="none"
                stroke="#374151"
                strokeWidth="2"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="55"
                fill="none"
                stroke={circleProgress > 50 ? '#22c55e' : circleProgress > 20 ? '#eab308' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${(circleProgress / 100) * 345.6} 345.6`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 0.3s ease' }}
              />
            </svg>

            {/* Timer Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-4xl font-bold ${timerColor}`}>{countdown}</div>
              <div className="text-gray-400 text-xs mt-1">seconds</div>
            </div>
          </div>
        </div>

        {/* Offer Details Card */}
        <div className="bg-gray-900 rounded-3xl p-6 border border-gray-700 space-y-6">
          {/* Rider Info */}
          <div className="flex items-center space-x-3 pb-4 border-b border-gray-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
              {rideSession.riderName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold">{rideSession.riderName}</div>
              <div className="text-gray-400 text-sm">⭐ {rideSession.riderRating.toFixed(1)} rating</div>
            </div>
          </div>

          {/* Trip Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Pickup Distance */}
            <div className="bg-gray-800 rounded-xl p-3">
              <div className="text-gray-400 text-xs mb-1">Pickup Distance</div>
              <div className="text-white font-bold text-lg">
                {rideSession.estimatedDistanceKm.toFixed(1)} km
              </div>
              <div className="text-gray-500 text-xs mt-1">
                ~{rideSession.estimatedDurationMin} min
              </div>
            </div>

            {/* Estimated Earnings */}
            <div className="bg-gray-800 rounded-xl p-3">
              <div className="text-gray-400 text-xs mb-1">Est. Earnings</div>
              <div className="text-green-400 font-bold text-lg">
                {formatCurrencyMZN(rideSession.estimatedFareMZN)}
              </div>
              <div className={`text-xs mt-1 ${
                stats.currentTier === 'GOLD' ? 'text-yellow-400' :
                stats.currentTier === 'SILVER' ? 'text-gray-400' :
                'text-gray-500'
              }`}>
                {stats.currentTier} tier
              </div>
            </div>
          </div>

          {/* Pickup Address */}
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-gray-400 text-xs mb-1">📍 Pickup</div>
            <div className="text-white font-medium text-sm">{rideSession.pickupAddress}</div>
          </div>

          {/* Destination (if Gold Tier) */}
          {stats.currentTier === 'GOLD' && (
            <div className="bg-gray-800 rounded-xl p-3">
              <div className="text-gray-400 text-xs mb-1">🎯 Destination</div>
              <div className="text-white font-medium text-sm">{rideSession.dropoffAddress}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {/* Decline Button (X) */}
            <button
              onClick={rejectOffer}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-colors duration-200 text-xl"
            >
              ✕
            </button>

            {/* Accept Button */}
            <button
              onClick={acceptOffer}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>✓</span>
              <span>Accept</span>
            </button>
          </div>
        </div>

        {/* Auto-decline message */}
        {countdown <= 5 && (
          <div className="mt-4 text-center text-red-400 text-sm font-medium animate-pulse">
            Will auto-decline in {countdown}s
          </div>
        )}
      </div>
    </div>
  );
}
