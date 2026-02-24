'use client';

import React, { useEffect } from 'react';
import { useDriverStore } from '@/store/driverStore';
import { useWaitingTimer, getSurchargeTier } from '@/hooks/useWaitingTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, DollarSign, AlertTriangle } from 'lucide-react';

/**
 * MAKKO INTELLIGENCE - SOVEREIGN REVENUE GENERATOR
 * 
 * Waiting Timer Component with Per-Minute Surcharge Calculation
 * 
 * ARCHITECTURE:
 * - 5-minute grace period (NO CHARGE)
 * - Progressive surcharge: 15 MZN per minute after grace
 * - Real-time revenue tracking for driver transparency
 * - Append-Only ledger integration on rider boarding
 * 
 * MOZAMBIQUE CONTEXT:
 * Compensates drivers for navigating crowded bairros and low-income
 * housing pickup challenges in Maputo/Matola.
 */
export default function WaitingTimer() {
  const {
    state,
    waitingTimer,
    startWaitingTimer,
    incrementWaitingTimer,
    stopWaitingTimer,
    applyWaitingFee,
    riderOnBoard,
    cancelRideNoShow,
  } = useDriverStore();

  // Sovereign Revenue Generator Hook (15 MZN per minute after 5-min grace)
  const timerData = useWaitingTimer({
    gracePeriodMinutes: 5,
    mznPerMinute: 15,
    roundUpPartialMinutes: true, // Ceil billable minutes (driver-friendly)
  });

  // ============================================================================
  // AUTO-START TIMER ON ARRIVAL
  // ============================================================================

  useEffect(() => {
    if (state === 'ARRIVED_AT_PICKUP' && !waitingTimer.startedAt) {
      startWaitingTimer();
    }
  }, [state, waitingTimer.startedAt, startWaitingTimer]);

  // ============================================================================
  // INCREMENT TIMER EVERY SECOND (Zustand Store Sync)
  // ============================================================================

  useEffect(() => {
    if (state === 'ARRIVED_AT_PICKUP' && waitingTimer.startedAt) {
      const interval = setInterval(() => {
        incrementWaitingTimer();
      }, 1000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [state, waitingTimer.startedAt, incrementWaitingTimer]);

  // ============================================================================
  // APPLY PROGRESSIVE SURCHARGE (Real-time calculation)
  // ============================================================================

  useEffect(() => {
    if (
      state === 'ARRIVED_AT_PICKUP' &&
      timerData.isOverGracePeriod &&
      !waitingTimer.waitingFeeApplied &&
      timerData.surchargeMZN.toNumber() > 0
    ) {
      // Apply progressive surcharge (not flat 50 MZN)
      applyWaitingFee(timerData.surchargeMZN.toNumber());
    }
  }, [
    state,
    timerData.isOverGracePeriod,
    timerData.surchargeMZN,
    waitingTimer.waitingFeeApplied,
    applyWaitingFee,
  ]);

  // ============================================================================
  // STOP TIMER ON RIDER BOARDING OR CANCELLATION
  // ============================================================================

  useEffect(() => {
    if (
      (state === 'RIDE_IN_PROGRESS' ||
        (state === 'ONLINE' && waitingTimer.noShowCancelled)) &&
      waitingTimer.startedAt
    ) {
      stopWaitingTimer();
    }
  }, [state, waitingTimer.startedAt, stopWaitingTimer, waitingTimer.noShowCancelled]);

  // ============================================================================
  // CONDITIONAL RENDER
  // ============================================================================

  if (state !== 'ARRIVED_AT_PICKUP' || !waitingTimer.startedAt) {
    return null;
  }

  const { elapsedSeconds, gracePeriodPercent, isOverGracePeriod } = timerData;
  const isNoShowTimeReached = elapsedSeconds >= 300;

  // Color coding based on surcharge tier
  const surchargeTier = getSurchargeTier(timerData.surchargeMZN);
  const progressColor =
    gracePeriodPercent < 50
      ? 'text-green-400'
      : gracePeriodPercent < 80
      ? 'text-yellow-400'
      : 'text-red-500';

  const surchargeColor =
    surchargeTier === 'none'
      ? 'text-gray-400'
      : surchargeTier === 'low'
      ? 'text-yellow-400'
      : surchargeTier === 'medium'
      ? 'text-orange-400'
      : 'text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-4 right-4 bg-gray-900 border border-gray-700 rounded-2xl p-4 z-30 shadow-lg"
    >
      {/* Header with Timer - SOVEREIGN VISUAL URGENCY */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center space-x-2">
          <Clock className={`w-5 h-5 ${isOverGracePeriod ? 'text-red-400 animate-pulse' : 'text-blue-400'}`} />
          <span>Waiting for Passenger</span>
        </h3>
        <motion.span 
          className={`font-mono text-lg font-bold ${progressColor}`}
          animate={isOverGracePeriod ? {
            scale: [1, 1.05, 1],
            color: ['#ef4444', '#dc2626', '#ef4444'],
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {timerData.timeDisplay}
        </motion.span>
      </div>

      {/* Progress Bar (Grace Period) */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
        <motion.div
          className={`h-full rounded-full ${
            gracePeriodPercent < 50
              ? 'bg-green-400'
              : gracePeriodPercent < 80
              ? 'bg-yellow-400'
              : 'bg-red-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(gracePeriodPercent, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Revenue Display (Sovereign Generator) */}
      <AnimatePresence mode="wait">
        {!isOverGracePeriod ? (
          // Grace Period Message
          <motion.div
            key="grace-period"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4"
          >
            <p className="text-gray-400 text-sm">
              ⏱️ Grace period: {Math.floor((300 - elapsedSeconds) / 60)}:
              {((300 - elapsedSeconds) % 60).toString().padStart(2, '0')} remaining
            </p>
            <p className="text-gray-500 text-xs mt-1">
              No surcharge until 5:00
            </p>
          </motion.div>
        ) : (
          // Progressive Surcharge Display
          <motion.div
            key="surcharge"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-3 rounded-lg border mb-4 ${
              surchargeTier === 'low'
                ? 'bg-yellow-900/20 border-yellow-700'
                : surchargeTier === 'medium'
                ? 'bg-orange-900/20 border-orange-700'
                : 'bg-red-900/30 border-red-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className={`w-5 h-5 ${surchargeColor}`} />
                <span className="text-white font-semibold text-sm">
                  Waiting Surcharge
                </span>
              </div>
              <span className={`font-mono text-lg font-bold ${surchargeColor}`}>
                +{timerData.surchargeFormatted}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {timerData.billableMinutes} billable min × 15 MZN/min
            </div>
            {surchargeTier === 'high' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 flex items-center space-x-1 text-red-300 text-xs"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Extended wait time</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          onClick={() => {
            // Apply final surcharge before boarding
            if (isOverGracePeriod && timerData.surchargeMZN.toNumber() > 0) {
              applyWaitingFee(timerData.surchargeMZN.toNumber());
            }
            riderOnBoard();
          }}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ✓ Rider Boarded
          {isOverGracePeriod && (
            <span className="text-xs block mt-0.5">
              (+{timerData.surchargeFormatted})
            </span>
          )}
        </motion.button>

        {/* NO-SHOW BUTTON - Locked until 5:00 */}
        <motion.button
          onClick={async () => {
            if (!isNoShowTimeReached) return;
            
            // Confirmation dialog with Sovereign messaging
            const confirmed = confirm(
              `Charge 50 MZN no-show penalty?\n\n` +
              `Wait time: ${Math.floor(elapsedSeconds / 60)} minutes\n` +
              `Driver compensation: 41.50 MZN (after 17% commission)\n\n` +
              `This action is immutable and will be recorded in the ledger.`
            );
            
            if (confirmed) {
              try {
                const driverId = localStorage.getItem('driver_id');
                const response = await fetch(
                  `/api/rides/${useDriverStore.getState().currentRideSession?.id}/cancel-no-show`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                    body: JSON.stringify({
                      elapsedSeconds,
                      driverId,
                    }),
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  console.log('No-show penalty applied:', data);
                  
                  // Haptic feedback
                  if ('vibrate' in navigator) {
                    navigator.vibrate([100, 50, 100]);
                  }
                  
                  // Return to ONLINE state
                  cancelRideNoShow();
                } else {
                  const error = await response.json();
                  alert(`Failed to apply no-show penalty: ${error.message || error.error}`);
                }
              } catch (error) {
                console.error('No-show API error:', error);
                alert('Network error. Please try again.');
              }
            }
          }}
          className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition ${
            isNoShowTimeReached
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] cursor-pointer'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
          }`}
          whileHover={isNoShowTimeReached ? { scale: 1.02 } : {}}
          whileTap={isNoShowTimeReached ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          disabled={!isNoShowTimeReached}
        >
          <X className="w-4 h-4" />
          <span className="text-xs">
            {isNoShowTimeReached ? 'Charge 50 MZN' : 'No-Show (Locked)'}
          </span>
        </motion.button>
      </div>

      {/* Transparency Note (Sovereign Execution) */}
      {isOverGracePeriod && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 text-xs text-center mt-3"
        >
          Surcharge compensates for extended pickup time
        </motion.p>
      )}
    </motion.div>
  );
}
