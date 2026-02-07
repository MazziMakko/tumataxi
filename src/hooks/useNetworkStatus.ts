/**
 * useNetworkStatus Hook
 * Detects online/offline, connection quality, and updates store
 * Defensive: Handles race conditions, timeout scenarios
 */

'use client';

import { useEffect, useRef } from 'react';
import { useDriverStore } from '@/store/driverStore';

type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';

// interface NetworkInfo {
//   effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
//   downlink?: number; // Mbps
//   rtt?: number; // Round-trip time in ms
//   saveData?: boolean;
// }

export function useNetworkStatus() {
  const setConnected = useDriverStore((s) => s.setConnected);
  const setConnectionQuality = useDriverStore((s) => s.setConnectionQuality);
  const connectionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // =========================================================================
  // DETERMINE CONNECTION QUALITY
  // =========================================================================
  const determineQuality = (): ConnectionQuality => {
    // Check navigator.connection (Chrome, Edge, Android)
    const conn = (navigator as any).connection || (navigator as any).mozConnection;

    if (!conn) {
      // Fallback: Assume good if no API available
      return navigator.onLine ? 'good' : 'offline';
    }

    const effectiveType = conn.effectiveType as string;
    const rtt = conn.rtt as number | undefined;

    // Offline check first
    if (!navigator.onLine) {
      return 'offline';
    }

    // Check effective type (4g, 3g, 2g, slow-2g)
    if (effectiveType === '4g') {
      return rtt && rtt < 50 ? 'excellent' : 'good';
    }
    if (effectiveType === '3g') {
      return 'good';
    }
    if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      return 'poor';
    }

    return 'good';
  };

  // =========================================================================
  // ONLINE/OFFLINE LISTENERS
  // =========================================================================
  const handleOnline = () => {
    console.log('[Driver] Network: ONLINE');
    setConnected(true);
    setConnectionQuality(determineQuality());

    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleOffline = () => {
    console.log('[Driver] Network: OFFLINE (3G Lost)');
    setConnected(false);
    setConnectionQuality('offline');
  };

  // =========================================================================
  // CONNECTION CHANGE LISTENER
  // =========================================================================
  const handleConnectionChange = () => {
    const quality = determineQuality();
    console.log('[Driver] Network Quality Changed:', quality);
    setConnectionQuality(quality);

    // If poor connection, set timeout to auto-reconnect detection
    if (quality === 'poor') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const newQuality = determineQuality();
        if (newQuality !== 'poor') {
          setConnectionQuality(newQuality);
        }
      }, 5000); // Retry after 5 seconds
    }
  };

  // =========================================================================
  // EFFECTS
  // =========================================================================
  useEffect(() => {
    // Check initial state
    const initialQuality = determineQuality();
    setConnected(navigator.onLine);
    setConnectionQuality(initialQuality);

    // Store reference to connection API
    connectionRef.current = (navigator as any).connection || (navigator as any).mozConnection;

    // Add listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (connectionRef.current) {
      connectionRef.current.addEventListener('change', handleConnectionChange);
    }

    // Periodic quality check (every 10 seconds)
    const intervalId = setInterval(() => {
      const quality = determineQuality();
      setConnectionQuality(quality);
    }, 10000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connectionRef.current) {
        connectionRef.current.removeEventListener('change', handleConnectionChange);
      }

      clearInterval(intervalId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [setConnected, setConnectionQuality]);

  return {
    isConnected: navigator.onLine,
    quality: determineQuality(),
  };
}

/**
 * useGeolocation Hook
 * Real-time driver location tracking with error handling
 */
export function useGeolocation() {
  const updateLocation = useDriverStore((s) => s.updateLocation);
  const watchIdRef = useRef<number | null>(null);
  const errorCountRef = useRef(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('[Driver] Geolocation API not available');
      return;
    }

    // =====================================================================
    // SUCCESS HANDLER
    // =====================================================================
    const handleSuccess = (position: GeolocationPosition) => {
      errorCountRef.current = 0; // Reset error count

      const { latitude, longitude } = position.coords;
      updateLocation(latitude, longitude);

      console.log(`[Driver] Location Updated: ${latitude}, ${longitude}`);
    };

    // =====================================================================
    // ERROR HANDLER
    // =====================================================================
    const handleError = (error: GeolocationPositionError) => {
      errorCountRef.current += 1;

      switch (error.code) {
        case error.PERMISSION_DENIED:
          console.error('[Driver] Location Permission Denied');
          break;
        case error.POSITION_UNAVAILABLE:
          console.warn('[Driver] Location Position Unavailable');
          break;
        case error.TIMEOUT:
          console.warn('[Driver] Location Request Timeout');
          break;
      }

      // Stop watching after 5 consecutive errors
      if (errorCountRef.current >= 5 && watchIdRef.current !== null) {
        console.error('[Driver] Geolocation: Too many errors, stopping watch');
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    // =====================================================================
    // START WATCHING POSITION
    // =====================================================================
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true, // Better accuracy (consumes more battery)
        maximumAge: 10000, // Accept cached position up to 10 seconds old
        timeout: 5000, // Wait max 5 seconds for position
      }
    );

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [updateLocation]);
}
