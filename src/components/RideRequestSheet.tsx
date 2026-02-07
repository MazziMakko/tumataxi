/**
 * Bottom Sheet - Ride Request Handler
 * Swipeable sheet with ride details
 * Accept/Decline buttons
 * Thumb-friendly inputs for mobile
 */

'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDriverStore } from '@/store/driverStore';
import { X, CheckCircle, XCircle, MapPin, Clock, DollarSign, Star } from 'lucide-react';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current driver location
 */
async function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Fallback to Maputo coordinates
        resolve({
          latitude: -25.9664,
          longitude: 32.5832
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

// ============================================================================
// TYPES
// ============================================================================

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// BOTTOM SHEET COMPONENT
// ============================================================================

export const RideRequestSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Store
  const currentRideSession = useDriverStore((s) => s.currentRideSession);
  const acceptOffer = useDriverStore((s) => s.acceptOffer);
  const rejectOffer = useDriverStore((s) => s.rejectOffer);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleAcceptRide = async () => {
    if (!currentRideSession) return;

    try {
      console.log('[Driver] Accepting ride:', currentRideSession.id);

      // MAKKO INTELLIGENCE: Ride acceptance API implementation
      try {
        const response = await fetch('/api/rides/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ 
            rideId: currentRideSession.id,
            driverId: localStorage.getItem('driver_id'),
            acceptedAt: new Date().toISOString(),
            estimatedArrival: new Date(Date.now() + 5 * 60000).toISOString() // 5 min ETA
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to accept ride: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Ride accepted successfully:', result);
        
        // Update ride status in real-time
        await fetch('/api/rides/status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            rideId: currentRideSession.id,
            status: 'accepted',
            driverLocation: await getCurrentLocation()
          })
        });

      } catch (error) {
        console.error('Ride acceptance failed:', error);
        // Show error to user
        alert('Failed to accept ride. Please try again.');
        return; // Don't proceed with state changes if API failed
      }

      // Haptic feedback
      triggerHaptic('success');

      // Update state using store action
      acceptOffer();
      onClose();

      // Navigate to ride in progress (TODO)
    } catch (error) {
      console.error('[Driver] Error accepting ride:', error);
      triggerHaptic('error');
    }
  };

  const handleDeclineRide = async () => {
    if (!currentRideSession) return;

    console.log('[Driver] Declining ride:', currentRideSession.id);

    // Haptic feedback
    triggerHaptic('warning');

    // Clear and close (this will be handled by rejectOffer at the end)
    // MAKKO INTELLIGENCE: Ride decline API implementation
    try {
      const response = await fetch('/api/rides/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          rideId: currentRideSession?.id,
          driverId: localStorage.getItem('driver_id'),
          declinedAt: new Date().toISOString(),
          reason: 'driver_declined' // Could be expanded with specific reasons
        }),
      });

      if (!response.ok) {
        console.error('Failed to notify backend of decline:', response.statusText);
        // Continue with UI update even if API fails (graceful degradation)
      } else {
        console.log('Ride decline notification sent successfully');
      }

      // Update driver availability status
      await fetch('/api/drivers/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          driverId: localStorage.getItem('driver_id'),
          status: 'available',
          lastActivity: new Date().toISOString()
        })
      });

    } catch (error) {
      console.error('Ride decline API call failed:', error);
      // Continue with UI update (graceful degradation)
    }

    // Update state using store action
    rejectOffer();
  };

  // =========================================================================
  // TOUCH HANDLERS FOR SWIPE
  // =========================================================================

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const endY = e.changedTouches[0].clientY;
    const diff = endY - startY;

    // If swiped down more than 50px, close
    if (diff > 50) {
      onClose();
    }

    setIsDragging(false);
  };

  const triggerHaptic = (type: 'success' | 'error' | 'warning') => {
    if (!navigator.vibrate) return;
    switch (type) {
      case 'success':
        navigator.vibrate([10, 20, 10]);
        break;
      case 'error':
        navigator.vibrate([50, 100, 50]);
        break;
      case 'warning':
        navigator.vibrate([30]);
        break;
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  if (!currentRideSession) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
          />

          {/* BOTTOM SHEET */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* SWIPE HANDLE */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-700 rounded-full" />
            </div>

            {/* CONTENT */}
            <div className="px-6 pb-8">
              {/* HEADER */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Ride Request</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-full transition"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* RIDER INFO */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {/* Rider Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {currentRideSession.riderName[0]}
                  </div>

                  {/* Rider Details */}
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {currentRideSession.riderName}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-gray-400">
                        {currentRideSession.riderRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROUTE DETAILS */}
              <div className="space-y-4 mb-6">
                {/* PICKUP */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div className="w-1 h-16 bg-gray-600 my-1" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-xs text-gray-500 uppercase mb-1">Pickup</p>
                    <p className="text-white font-medium text-sm">
                      {currentRideSession.pickupAddress}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {currentRideSession.estimatedDurationMin} min away
                    </p>
                  </div>
                </div>

                {/* DROPOFF */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-xs text-gray-500 uppercase mb-1">Dropoff</p>
                    <p className="text-white font-medium text-sm">
                      {currentRideSession.dropoffAddress}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {currentRideSession.estimatedDistanceKm.toFixed(1)} km away
                    </p>
                  </div>
                </div>
              </div>

              {/* RIDE INFO GRID */}
              <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-800 rounded-lg p-4">
                <div className="text-center">
                  <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-lg font-bold text-white">
                    {currentRideSession.estimatedDurationMin}
                  </p>
                  <p className="text-xs text-gray-400">minutes</p>
                </div>

                <div className="text-center border-l border-r border-gray-700">
                  <MapPin className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-lg font-bold text-white">
                    {currentRideSession.estimatedDistanceKm.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400">km</p>
                </div>

                <div className="text-center">
                  <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-2" />
                  <p className="text-lg font-bold text-green-400">
                    {currentRideSession.estimatedFareMZN.toLocaleString('pt-MZ', {
                      style: 'currency',
                      currency: 'MZN',
                    })}
                  </p>
                  <p className="text-xs text-gray-400">estimated</p>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="grid grid-cols-2 gap-4">
                {/* DECLINE BUTTON */}
                <button
                  onClick={handleDeclineRide}
                  className="py-4 rounded-xl font-bold text-white bg-gray-700 hover:bg-gray-600 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Decline
                </button>

                {/* ACCEPT BUTTON */}
                <button
                  onClick={handleAcceptRide}
                  className="py-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-95 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accept
                </button>
              </div>

              {/* SAFETY INFO */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Make sure pickup location is safe before accepting
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
