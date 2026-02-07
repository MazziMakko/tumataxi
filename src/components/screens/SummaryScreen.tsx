'use client';

import React, { useState } from 'react';
import { useDriverStore, useCurrentRideSession } from '@/store/driverStore';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';

/**
 * SummaryScreen (TRIP_SUMMARY)
 * Post-trip summary with earnings and rating
 */
export default function SummaryScreen() {
  const { completeRide, goOnline } = useDriverStore();
  const rideSession = useCurrentRideSession();
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!rideSession) {
    return null;
  }

  const handleSubmitRating = () => {
    if (rating === null) return;

    completeRide(
      rideSession.actualFareMZN || rideSession.estimatedFareMZN,
      rating,
      feedback
    );

    setSubmitted(true);
  };

  const handleReturnToOnline = () => {
    goOnline();
  };

  const StarRating = ({ value, onChange }: { value: number | null; onChange: (v: number) => void }) => (
    <div className="flex justify-center space-x-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className={`text-5xl transition-transform duration-200 ${
            value && value >= star ? 'scale-125' : 'scale-100'
          } ${
            value && value >= star ? 'text-yellow-400' : 'text-gray-600'
          }`}
        >
          ⭐
        </button>
      ))}
    </div>
  );

  if (submitted) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-6">
        {/* Checkmark Animation */}
        <div className="mb-8 animate-bounce">
          <div className="text-6xl">✓</div>
        </div>

        {/* Success Message */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-white">Trip Complete!</h1>
          <p className="text-gray-400 text-lg">Thank you for the ride</p>

          <div className="mt-8 bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Total Earnings</div>
            <div className="text-4xl font-bold text-green-400 mb-4">
              {formatCurrencyMZN(rideSession.actualFareMZN || rideSession.estimatedFareMZN)}
            </div>
            <div className="h-1 bg-gradient-to-r from-green-500 to-green-700 rounded-full" />
          </div>

          <div className="pt-4 text-gray-500 text-sm">
            ⭐ Rating Submitted
            <br />
            Driver thanks {rideSession.riderName}
          </div>
        </div>

        {/* Return to Online Button */}
        <button
          onClick={handleReturnToOnline}
          className="mt-12 w-full max-w-xs bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-full transition-colors duration-200 text-lg"
        >
          🟢 Back to Online
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-6 overflow-y-auto">
      {/* Main Earnings Display */}
      <div className="w-full max-w-md space-y-8">
        {/* Status */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Trip Summary</h1>
          <p className="text-gray-400">Rate your experience with {rideSession.riderName}</p>
        </div>

        {/* Big Earnings Card */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-8 text-center text-white shadow-2xl">
          <div className="text-sm font-medium opacity-80 mb-2">Total Earnings</div>
          <div className="text-6xl font-black mb-2">
            {formatCurrencyMZN(rideSession.estimatedFareMZN)}
          </div>
          <div className="text-sm opacity-70">+ Potential Tips</div>
        </div>

        {/* Trip Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
            <span className="text-gray-400">Distance</span>
            <span className="text-white font-bold">{rideSession.estimatedDistanceKm.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
            <span className="text-gray-400">Duration</span>
            <span className="text-white font-bold">~{rideSession.estimatedDurationMin} min</span>
          </div>
          <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
            <span className="text-gray-400">Passenger</span>
            <span className="text-white font-bold">{rideSession.riderName}</span>
          </div>
        </div>

        {/* Rating Section */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white mb-4">How was your experience?</h2>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Feedback Optional */}
          {rating && rating >= 4 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <label className="text-gray-400 text-sm font-medium mb-2 block">
                Additional feedback (optional)
              </label>
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Everything good? Any suggestions?"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitRating}
          disabled={rating === null}
          className={`w-full font-bold py-4 rounded-full text-lg transition-all duration-200 ${
            rating === null
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {rating === null ? 'Select a rating' : `Submit & Continue`}
        </button>

        {/* Helper Text */}
        <p className="text-gray-500 text-xs text-center">
          Your rating helps maintain quality service
        </p>
      </div>
    </div>
  );
}
