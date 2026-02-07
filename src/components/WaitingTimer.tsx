'use client';

import React, { useEffect } from 'react';
import { useDriverStore } from '@/store/driverStore';
import { motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';

/**
 * Waiting Timer Component
 * Shows in ARRIVED_AT_PICKUP state
 * Starts a 5-minute timer, after which:
 * - "Passenger No-Show" button appears
 * - Waiting fee is automatically applied
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

  // Start timer when arriving at pickup
  useEffect(() => {
    if (state === 'ARRIVED_AT_PICKUP' && !waitingTimer.startedAt) {
      startWaitingTimer();
    }
  }, [state, waitingTimer.startedAt, startWaitingTimer]);

  // Increment timer every second
  useEffect(() => {
    if (state === 'ARRIVED_AT_PICKUP' && waitingTimer.startedAt) {
      const interval = setInterval(() => {
        incrementWaitingTimer();
      }, 1000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [state, waitingTimer.startedAt, incrementWaitingTimer]);

  // Apply waiting fee after 5 minutes (300 seconds)
  useEffect(() => {
    if (state === 'ARRIVED_AT_PICKUP' && waitingTimer.elapsedSeconds === 300 && !waitingTimer.waitingFeeApplied) {
      const WAITING_FEE_MZN = 50; // 50 MZN after 5 minutes
      applyWaitingFee(WAITING_FEE_MZN);
    }
  }, [state, waitingTimer.elapsedSeconds, waitingTimer.waitingFeeApplied, applyWaitingFee]);

  // Stop timer when rider boards or ride is cancelled
  useEffect(() => {
    if ((state === 'RIDE_IN_PROGRESS' || (state === 'ONLINE' && waitingTimer.noShowCancelled)) && waitingTimer.startedAt) {
      stopWaitingTimer();
    }
  }, [state, waitingTimer.startedAt, stopWaitingTimer, waitingTimer.noShowCancelled]);

  if (state !== 'ARRIVED_AT_PICKUP' || !waitingTimer.startedAt) {
    return null;
  }

  const elapsed = waitingTimer.elapsedSeconds;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isWaitingFeeApplied = elapsed >= 300 && waitingTimer.waitingFeeApplied;
  const isNoShowTimeReached = elapsed >= 300;

  // Calculate progress (5 min = 300 sec)
  const progressPercent = (elapsed / 300) * 100;
  const progressColor =
    progressPercent < 50
      ? 'text-green-400'
      : progressPercent < 80
      ? 'text-yellow-400'
      : 'text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-4 right-4 bg-gray-900 border border-gray-700 rounded-2xl p-4 z-30 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <span>Waiting for Passenger</span>
        </h3>
        <span className={`font-mono text-lg font-bold ${progressColor}`}>{timeString}</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
        <motion.div
          className={`h-full rounded-full ${
            progressPercent < 50
              ? 'bg-green-400'
              : progressPercent < 80
              ? 'bg-yellow-400'
              : 'bg-red-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progressPercent, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Status Messages */}
      <div className="space-y-2 mb-4">
        {!isWaitingFeeApplied && (
          <p className="text-gray-400 text-sm">
            {elapsed < 300
              ? `⏱️ You have ${Math.max(0, 5 - minutes)} min ${Math.max(0, 60 - seconds)} sec before no-show fee applies`
              : 'Fee applied'}
          </p>
        )}

        {isWaitingFeeApplied && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-red-900/30 border border-red-700 rounded-lg"
          >
            <p className="text-red-300 text-sm font-semibold">
              ⚠️ Waiting Fee: +50 MZN added to fare
            </p>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          onClick={() => riderOnBoard()}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ✓ Rider Boarded
        </motion.button>

        {isNoShowTimeReached && (
          <motion.button
            onClick={() => cancelRideNoShow()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <X className="w-4 h-4" />
            <span>Cancel (No-Show)</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
