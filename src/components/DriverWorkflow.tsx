'use client';

import React, { useEffect } from 'react';
import { useDriverStore, useRideState, useOfferCountdown } from '@/store/driverStore';
import { motion, AnimatePresence } from 'framer-motion';

// Import Screens
import HomeScreen from './screens/HomeScreen';
import OfferScreen from './screens/OfferScreen';
import PickupScreen from './screens/PickupScreen';
import TripScreen from './screens/TripScreen';
import SummaryScreen from './screens/SummaryScreen';

// Import Feature Components
import SidebarNavigation from './SidebarNavigation';
import WaitingTimer from './WaitingTimer';
import SOSShield from './SOSShield';

/**
 * DriverWorkflow.tsx
 * Main component that orchestrates all views based on driver state
 * Uses framer-motion for smooth state transitions
 *
 * State Flow:
 * OFFLINE -> ONLINE -> OFFER_RECEIVED -> NAVIGATING_TO_PICKUP -> ARRIVED_AT_PICKUP
 *         -> RIDE_IN_PROGRESS -> ARRIVED_AT_DESTINATION -> TRIP_SUMMARY -> ONLINE
 */
export default function DriverWorkflow() {
  const state = useRideState();
  const countdown = useOfferCountdown();
  const { decrementOfferCountdown } = useDriverStore();

  // Decrement offer countdown every second
  useEffect(() => {
    if (state === 'OFFER_RECEIVED') {
      const interval = setInterval(() => {
        decrementOfferCountdown();
      }, 1000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [state, decrementOfferCountdown]);

  // Define slide transition variants
  const slideVariants = {
    initial: (direction: 'up' | 'down') => ({
      opacity: 0,
      y: direction === 'up' ? 1000 : -1000,
    }),
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    exit: (direction: 'up' | 'down') => ({
      opacity: 0,
      y: direction === 'up' ? -1000 : 1000,
      transition: {
        duration: 0.5,
        ease: 'easeIn',
      },
    }),
  };

  // Define fade transition variants
  const fadeVariants = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      {/* Main Content Area with AnimatePresence for smooth transitions */}
      <AnimatePresence mode="wait">
        {/* OFFLINE / ONLINE STATE */}
        {(state === 'OFFLINE' || state === 'ONLINE') && (
          <motion.div
            key="home-screen"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
          >
            <HomeScreen />
          </motion.div>
        )}

        {/* OFFER RECEIVED STATE */}
        {state === 'OFFER_RECEIVED' && (
          <motion.div
            key="offer-screen"
            custom="up"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
          >
            <OfferScreen />
          </motion.div>
        )}

        {/* NAVIGATING_TO_PICKUP STATE */}
        {state === 'NAVIGATING_TO_PICKUP' && (
          <motion.div
            key="navigation-screen"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
          >
            <PickupScreen mode="navigating" />
          </motion.div>
        )}

        {/* ARRIVED_AT_PICKUP STATE */}
        {state === 'ARRIVED_AT_PICKUP' && (
          <motion.div
            key="arrived-screen"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
          >
            <PickupScreen mode="arrived" />
          </motion.div>
        )}

        {/* RIDE_IN_PROGRESS STATE */}
        {state === 'RIDE_IN_PROGRESS' && (
          <motion.div
            key="trip-screen"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
          >
            <TripScreen />
          </motion.div>
        )}

        {/* ARRIVED_AT_DESTINATION STATE */}
        {state === 'ARRIVED_AT_DESTINATION' && (
          <motion.div
            key="arrived-destination-screen"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
          >
            <TripScreen mode="destination" />
          </motion.div>
        )}

        {/* TRIP_SUMMARY STATE */}
        {state === 'TRIP_SUMMARY' && (
          <motion.div
            key="summary-screen"
            custom="up"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
          >
            <SummaryScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature Components - Always rendered on top */}
      <SidebarNavigation />
      <WaitingTimer />
      <SOSShield />

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg text-xs font-mono border border-gray-700 z-20 max-w-48">
          <div className="font-bold mb-2">Current State: {state}</div>
          {state === 'OFFER_RECEIVED' && (
            <div className="text-yellow-400">Countdown: {countdown}s</div>
          )}
        </div>
      )}
    </div>
  );
}
