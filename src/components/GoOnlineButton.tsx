/**
 * Go Online Button
 * Massive, pill-shaped button
 * Green = Online, Grey = Offline
 * Haptic feedback on toggle
 * Race condition handling for rapid clicks
 */

'use client';

import React, { useState, useRef } from 'react';
import { useDriverStore } from '@/store/driverStore';
import { useNetworkStatus, useGeolocation } from '@/hooks/useNetworkStatus';
import { Loader } from 'lucide-react';

// ============================================================================
// COMPONENT
// ============================================================================

export const GoOnlineButton: React.FC = () => {
  const [isToggling, setIsToggling] = useState(false);
  const toggleRef = useRef(false); // Prevent race conditions from double-clicks

  // Store actions
  const isOnline = useDriverStore((s) => s.state !== 'OFFLINE');
  const goOnline = useDriverStore((s) => s.goOnline);
  const goOffline = useDriverStore((s) => s.goOffline);
  const connectionStatus = useDriverStore((s) => ({
    isConnected: s.isConnected,
    quality: s.connectionQuality,
  }));

  // Hooks
  useNetworkStatus();
  useGeolocation();

  // =========================================================================
  // HANDLE TOGGLE (WITH RACE CONDITION PREVENTION)
  // =========================================================================
  const handleToggle = async () => {
    // Prevent rapid double-clicks
    if (toggleRef.current) {
      return;
    }

    // Check network before going online
    if (!isOnline && !connectionStatus.isConnected) {
      // Trigger haptic feedback (error)
      triggerHaptic('error');
      alert('No internet connection. Please check your network.');
      return;
    }

    // Lock toggle
    toggleRef.current = true;
    setIsToggling(true);

    try {
      // Haptic feedback (success)
      triggerHaptic('success');

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Toggle online status
      if (isOnline) {
        goOffline();
      } else {
        goOnline();
      }

      console.log(`[Driver] Status: ${!isOnline ? 'ONLINE' : 'OFFLINE'}`);
    } catch (error) {
      console.error('[Driver] Toggle error:', error);
      triggerHaptic('error');
    } finally {
      setIsToggling(false);
      toggleRef.current = false;
    }
  };

  // =========================================================================
  // HAPTIC FEEDBACK
  // =========================================================================
  const triggerHaptic = (type: 'success' | 'error' | 'warning') => {
    if (!navigator.vibrate) return;

    switch (type) {
      case 'success':
        navigator.vibrate([10, 20, 10]); // Short double tap
        break;
      case 'error':
        navigator.vibrate([50, 100, 50]); // Longer pattern
        break;
      case 'warning':
        navigator.vibrate([30]); // Single pulse
        break;
    }
  };

  // =========================================================================
  // DETERMINE BUTTON STATE
  // =========================================================================
  const getButtonState = () => {
    if (isToggling) return 'toggling';
    if (!connectionStatus.isConnected) return 'disconnected';
    if (isOnline) return 'online';
    return 'offline';
  };

  const state = getButtonState();

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full px-4 max-w-sm">
      {/* CONNECTION STATUS TEXT */}
      <div className="text-center mb-3">
        <div className={`text-xs font-semibold uppercase tracking-wider ${
          state === 'online'
            ? 'text-green-400'
            : state === 'disconnected'
            ? 'text-red-400'
            : 'text-gray-400'
        }`}>
          {state === 'online' && '🟢 Online • Accepting Rides'}
          {state === 'offline' && '⚪ Offline • Not Accepting'}
          {state === 'disconnected' && '🔴 No Network Connection'}
          {state === 'toggling' && '⏳ Updating Status...'}
        </div>
      </div>

      {/* MAIN BUTTON */}
      <button
        onClick={handleToggle}
        disabled={isToggling || state === 'disconnected'}
        className={`
          w-full py-6 rounded-full font-bold text-lg transition-all duration-300
          flex items-center justify-center gap-2
          active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
          shadow-2xl
          
          ${
            state === 'online'
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
              : state === 'toggling'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
          }
        `}
        aria-label={isOnline ? 'Go Offline' : 'Go Online'}
      >
        {isToggling && <Loader className="w-5 h-5 animate-spin" />}

        {!isToggling && isOnline && (
          <span>🟢 Go Offline</span>
        )}

        {!isToggling && !isOnline && state !== 'disconnected' && (
          <span>⚪ Go Online</span>
        )}

        {state === 'disconnected' && (
          <span>📡 No Connection</span>
        )}
      </button>

      {/* SECONDARY INFO */}
      {connectionStatus.quality && state !== 'disconnected' && (
        <div className="text-xs text-gray-400 text-center mt-3">
          Network: {connectionStatus.quality === 'excellent' && '🟢 Excellent'}
          {connectionStatus.quality === 'good' && '🟢 Good'}
          {connectionStatus.quality === 'poor' && '🟡 Poor (3G)'}
          {connectionStatus.quality === 'offline' && '🔴 Offline'}
        </div>
      )}
    </div>
  );
};
