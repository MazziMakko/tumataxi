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
 * DriverWorkflow.tsx - MAKKO INTELLIGENCE SOVEREIGN UX ENGINE
 * 
 * Deterministic State Machine with 60 FPS Neuro-Symbiotic Transitions
 * 
 * ARCHITECTURE:
 * - Single Source of Truth: useDriverStore (Zustand)
 * - GPU-Accelerated Animations: transform3d + will-change
 * - Bottom Sheet Pattern: OFFER_RECEIVED slides up from bottom
 * - Waiting Timer Auto-Trigger: ARRIVED_AT_PICKUP initiates 5-min countdown
 * 
 * State Flow:
 * OFFLINE → ONLINE → OFFER_RECEIVED → NAVIGATING_TO_PICKUP → ARRIVED_AT_PICKUP
 *         → RIDE_IN_PROGRESS → ARRIVED_AT_DESTINATION → TRIP_SUMMARY → ONLINE
 */
export default function DriverWorkflow() {
  const state = useRideState();
  const countdown = useOfferCountdown();
  const { decrementOfferCountdown, startWaitingTimer, waitingTimer } = useDriverStore();

  // ============================================================================
  // RULIAL LOGIC: Offer Countdown Decrement
  // ============================================================================
  useEffect(() => {
    if (state === 'OFFER_RECEIVED') {
      const interval = setInterval(() => {
        decrementOfferCountdown();
      }, 1000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [state, decrementOfferCountdown]);

  // ============================================================================
  // RULIAL LOGIC: Auto-Start Waiting Timer on ARRIVED_AT_PICKUP
  // ============================================================================
  useEffect(() => {
    if (state === 'ARRIVED_AT_PICKUP' && !waitingTimer.startedAt) {
      // Trigger waiting timer immediately upon arrival
      startWaitingTimer();
    }
  }, [state, waitingTimer.startedAt, startWaitingTimer]);

  // ============================================================================
  // 60 FPS OPTIMIZED ANIMATION VARIANTS
  // ============================================================================

  /**
   * Bottom Sheet Variants (OFFER_RECEIVED)
   * Uses transform3d for GPU acceleration
   */
  const bottomSheetVariants = {
    hidden: {
      y: '100%',
      opacity: 0,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      },
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 200,
        mass: 0.8,
      },
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      },
    },
  };

  /**
   * Slide Variants (TRIP_SUMMARY)
   * Vertical slide with GPU acceleration
   */
  const slideVariants = {
    initial: (direction: 'up' | 'down') => ({
      opacity: 0,
      y: direction === 'up' ? '100vh' : '-100vh',
      scale: 0.95,
    }),
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 200,
        mass: 0.5,
      },
    },
    exit: (direction: 'up' | 'down') => ({
      opacity: 0,
      y: direction === 'up' ? '-100vh' : '100vh',
      scale: 0.95,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      },
    }),
  };

  /**
   * Fade Variants (Standard Transitions)
   * Optimized for 3G networks in Mozambique
   */
  const fadeVariants = {
    initial: {
      opacity: 0,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // Custom easing for smoothness
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1],
      },
    },
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      {/* ======================================================================
          MAIN CONTENT AREA - AnimatePresence for Smooth State Transitions
          ====================================================================== */}
      <AnimatePresence mode="wait">
        {/* OFFLINE / ONLINE STATE - Map View */}
        {(state === 'OFFLINE' || state === 'ONLINE') && (
          <motion.div
            key="home-screen"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
            style={{
              willChange: 'opacity, transform',
            }}
          >
            <HomeScreen />
          </motion.div>
        )}

        {/* OFFER RECEIVED STATE - Bottom Sheet Pattern (60 FPS) */}
        {state === 'OFFER_RECEIVED' && (
          <motion.div
            key="offer-screen"
            variants={bottomSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 z-40"
            style={{
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <OfferScreen />
          </motion.div>
        )}

        {/* NAVIGATING_TO_PICKUP STATE - Turn-by-Turn */}
        {state === 'NAVIGATING_TO_PICKUP' && (
          <motion.div
            key="navigation-screen"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
            style={{
              willChange: 'opacity, transform',
            }}
          >
            <PickupScreen mode="navigating" />
          </motion.div>
        )}

        {/* ARRIVED_AT_PICKUP STATE - Waiting Timer Auto-Triggers */}
        {state === 'ARRIVED_AT_PICKUP' && (
          <motion.div
            key="arrived-screen"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
            style={{
              willChange: 'opacity, transform',
            }}
          >
            <PickupScreen mode="arrived" />
          </motion.div>
        )}

        {/* RIDE_IN_PROGRESS STATE - Active Trip HUD */}
        {state === 'RIDE_IN_PROGRESS' && (
          <motion.div
            key="trip-screen"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
            style={{
              willChange: 'opacity, transform',
            }}
          >
            <TripScreen />
          </motion.div>
        )}

        {/* ARRIVED_AT_DESTINATION STATE - Payment Pending */}
        {state === 'ARRIVED_AT_DESTINATION' && (
          <motion.div
            key="arrived-destination-screen"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
            style={{
              willChange: 'opacity, transform',
            }}
          >
            <TripScreen mode="destination" />
          </motion.div>
        )}

        {/* TRIP_SUMMARY STATE - Rating & Earnings */}
        {state === 'TRIP_SUMMARY' && (
          <motion.div
            key="summary-screen"
            custom="up"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-screen"
            style={{
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <SummaryScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================================
          SOVEREIGN FEATURE COMPONENTS - Always On Top
          ====================================================================== */}
      <SidebarNavigation />
      
      {/* Waiting Timer - Only renders when ARRIVED_AT_PICKUP */}
      <AnimatePresence>
        {state === 'ARRIVED_AT_PICKUP' && <WaitingTimer />}
      </AnimatePresence>
      
      {/* SOS Shield - Always Available During Active Ride */}
      <SOSShield />

      {/* ======================================================================
          DEBUG HUD - Development Only
          ====================================================================== */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm text-white p-3 rounded-lg text-xs font-mono border border-emerald-500/30 z-50 max-w-48"
        >
          <div className="font-bold mb-2 text-emerald-400">
            State: {state}
          </div>
          {state === 'OFFER_RECEIVED' && (
            <div className="text-yellow-400">
              ⏱️ Countdown: {countdown}s
            </div>
          )}
          {state === 'ARRIVED_AT_PICKUP' && waitingTimer.startedAt && (
            <div className="text-blue-400">
              ⏲️ Waiting: {waitingTimer.elapsedSeconds}s
            </div>
          )}
          <div className="text-gray-400 text-[10px] mt-1">
            60 FPS GPU Accelerated
          </div>
        </motion.div>
      )}
    </div>
  );
}
