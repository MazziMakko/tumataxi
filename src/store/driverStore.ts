/**
 * Driver State Management (Zustand)
 * Deterministic State Machine for Ride-Hailing Driver App
 *
 * States:
 * 1. OFFLINE - Home tab, not accepting rides
 * 2. ONLINE - Scanning for rides, waiting for offers
 * 3. OFFER_RECEIVED - Ring screen, countdown timer
 * 4. NAVIGATING_TO_PICKUP - Accepted, en route to pickup
 * 5. ARRIVED_AT_PICKUP - At pickup location, waiting for rider
 * 6. RIDE_IN_PROGRESS - Passenger on board, en route to destination
 * 7. ARRIVED_AT_DESTINATION - At destination, payment pending
 * 8. TRIP_SUMMARY - Rating & earnings review, then returns to ONLINE
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/lib/i18n';

// ============================================================================
// TYPES
// ============================================================================

export type RideState =
  | 'OFFLINE'
  | 'ONLINE'
  | 'OFFER_RECEIVED'
  | 'NAVIGATING_TO_PICKUP'
  | 'ARRIVED_AT_PICKUP'
  | 'RIDE_IN_PROGRESS'
  | 'ARRIVED_AT_DESTINATION'
  | 'TRIP_SUMMARY';

export interface RideRequest {
  id: string;
  riderId: string;
  riderName: string;
  riderRating: number;
  pickupLat: number;
  pickupLon: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLon: number;
  dropoffAddress: string;
  estimatedFareMZN: number;
  estimatedDurationMin: number;
  estimatedDistanceKm: number;
  requestedAt: Date;
}

export interface RideSession {
  id: string;
  riderId: string;
  riderName: string;
  riderRating: number;
  pickupAddress: string;
  dropoffAddress: string;
  estimatedFareMZN: number;
  actualFareMZN: number | null;
  estimatedDurationMin: number;
  actualDurationMin: number | null;
  estimatedDistanceKm: number;
  actualDistanceKm: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  riderRatingGiven: number | null;
  riderFeedback: string | null;
}

export interface DriverStats {
  todaysEarningsMZN: number;
  activityScore: number; // 0-100
  totalRidesThisWeek: number;
  currentTier: 'BRONZE' | 'SILVER' | 'GOLD';
  averageRating: number;
  nextTierRidesNeeded: number;
}

export interface VehicleDetails {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  seatingCapacity: number;
}

export interface EarningsBreakdown {
  Monday: number;
  Tuesday: number;
  Wednesday: number;
  Thursday: number;
  Friday: number;
  Saturday: number;
  Sunday: number;
}

export interface DriverSettings {
  mapSoundEnabled: boolean;
  nightModeEnabled: boolean;
  shareLocationEnabled: boolean;
  pushNotificationsEnabled: boolean;
  language: Language;
}

export interface WaitingTimerState {
  startedAt: Date | null;
  elapsedSeconds: number;
  waitingFeeApplied: boolean;
  noShowCancelled: boolean;
}

export interface DriverStoreState {
  // === STATE MACHINE ===
  state: RideState;
  stateHistory: RideState[];

  // === RIDE SESSION ===
  currentRideSession: RideSession | null;
  offlineRideQueue: RideRequest[];

  // === NETWORK & LOCATION ===
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  currentLat: number | null;
  currentLon: number | null;
  lastLocationUpdate: Date | null;

  // === STATS & EARNINGS ===
  stats: DriverStats;

  // === OFFER SCREEN STATE ===
  offerExpiresAt: Date | null; // Countdown timer for offer
  offerCountdown: number; // seconds remaining

  // === WAITING TIMER (ARRIVED_AT_PICKUP) ===
  waitingTimer: WaitingTimerState;

  // === SOS SHIELD ===
  sosShieldActive: boolean;
  sosShieldLocation: { lat: number; lon: number } | null;

  // === DRIVER PROFILE & SETTINGS ===
  vehicleDetails: VehicleDetails;
  earningsBreakdown: EarningsBreakdown;
  settings: DriverSettings;
  licenseDocumentUrl: string | null;
  profilePhotoUrl: string | null;

  // === UI STATE ===
  sidebarOpen: boolean;

  // === ACTIONS: STATE TRANSITIONS ===
  goOnline: () => void;
  goOffline: () => void;
  receiveOffer: (request: RideRequest) => void;
  acceptOffer: () => void;
  rejectOffer: () => void;
  arrivedAtPickup: () => void;
  riderOnBoard: () => void;
  arrivedAtDestination: () => void;
  completeRide: (actualFareMZN: number, riderRating: number, feedback?: string) => void;
  cancelRideNoShow: () => void; // Cancel ride due to passenger no-show

  // === ACTIONS: NETWORK & LOCATION ===
  setConnected: (isConnected: boolean) => void;
  setConnectionQuality: (quality: 'excellent' | 'good' | 'poor' | 'offline') => void;
  updateLocation: (lat: number, lon: number) => void;

  // === ACTIONS: STATS ===
  updateStats: (stats: Partial<DriverStats>) => void;
  addToOfflineQueue: (request: RideRequest) => void;
  clearOfflineQueue: () => void;

  // === ACTIONS: WAITING TIMER ===
  startWaitingTimer: () => void;
  incrementWaitingTimer: () => void;
  stopWaitingTimer: () => void;
  applyWaitingFee: (waitingFeeMZN: number) => void;

  // === ACTIONS: SOS SHIELD ===
  activateSosShield: (lat: number, lon: number) => void;
  deactivateSosShield: () => void;
  shareSosLocation: () => void;
  recordSosAudio: () => void;

  // === ACTIONS: PROFILE & SETTINGS ===
  updateVehicleDetails: (vehicle: Partial<VehicleDetails>) => void;
  updateEarningsBreakdown: (earnings: Partial<EarningsBreakdown>) => void;
  updateSettings: (settings: Partial<DriverSettings>) => void;
  setLanguage: (language: Language) => void;
  setProfilePhoto: (url: string) => void;
  setLicenseDocument: (url: string) => void;

  // === ACTIONS: UI ===
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // === ACTIONS: UTILITY ===
  decrementOfferCountdown: () => void;
  reset: () => void;
}

// ============================================================================
// STORE
// ============================================================================

const initialStats: DriverStats = {
  todaysEarningsMZN: 0,
  activityScore: 75,
  totalRidesThisWeek: 0,
  currentTier: 'BRONZE',
  averageRating: 4.8,
  nextTierRidesNeeded: 50,
};

const initialVehicleDetails: VehicleDetails = {
  make: 'Toyota',
  model: 'Corolla',
  year: 2022,
  licensePlate: 'AA-123-XY',
  color: 'Black',
  seatingCapacity: 5,
};

const initialEarningsBreakdown: EarningsBreakdown = {
  Monday: 0,
  Tuesday: 0,
  Wednesday: 0,
  Thursday: 0,
  Friday: 0,
  Saturday: 0,
  Sunday: 0,
};

const initialSettings: DriverSettings = {
  mapSoundEnabled: true,
  nightModeEnabled: false,
  shareLocationEnabled: true,
  pushNotificationsEnabled: true,
  language: 'pt',
};

const initialWaitingTimer: WaitingTimerState = {
  startedAt: null,
  elapsedSeconds: 0,
  waitingFeeApplied: false,
  noShowCancelled: false,
};

export const useDriverStore = create<DriverStoreState>()(
  persist(
    (set, _get) => ({
      // === INITIAL STATE ===
      state: 'OFFLINE',
      stateHistory: ['OFFLINE'],
      currentRideSession: null,
      offlineRideQueue: [],
      isConnected: true,
      connectionQuality: 'excellent',
      currentLat: -25.9692, // Maputo
      currentLon: 32.5732,
      lastLocationUpdate: new Date(),
      stats: initialStats,
      offerExpiresAt: null,
      offerCountdown: 0,
      waitingTimer: initialWaitingTimer,
      sosShieldActive: false,
      sosShieldLocation: null,
      vehicleDetails: initialVehicleDetails,
      earningsBreakdown: initialEarningsBreakdown,
      settings: initialSettings,
      licenseDocumentUrl: null,
      profilePhotoUrl: null,
      sidebarOpen: false,

      // === STATE TRANSITIONS ===

      /**
       * Transition: * -> ONLINE
       * Driver goes online, ready to accept ride offers
       */
      goOnline: () =>
        set((state) => {
          if (state.state === 'OFFLINE') {
            return {
              state: 'ONLINE',
              stateHistory: [...state.stateHistory, 'ONLINE'],
            };
          }
          return state; // Ignore if not in OFFLINE
        }),

      /**
       * Transition: ONLINE -> OFFLINE
       * Driver goes offline, stops accepting rides
       */
      goOffline: () =>
        set((state) => {
          if (state.state === 'ONLINE' || state.state === 'TRIP_SUMMARY') {
            return {
              state: 'OFFLINE',
              stateHistory: [...state.stateHistory, 'OFFLINE'],
              currentRideSession: null,
              offerExpiresAt: null,
              offerCountdown: 0,
            };
          }
          return state; // Ignore if not in ONLINE or TRIP_SUMMARY
        }),

      /**
       * Transition: ONLINE -> OFFER_RECEIVED
       * Driver receives a ride offer, starts countdown
       */
      receiveOffer: (request: RideRequest) =>
        set((state) => {
          if (state.state === 'ONLINE') {
            const expiresAt = new Date(Date.now() + 30000); // 30 seconds
            return {
              state: 'OFFER_RECEIVED',
              stateHistory: [...state.stateHistory, 'OFFER_RECEIVED'],
              currentRideSession: {
                id: request.id,
                riderId: request.riderId,
                riderName: request.riderName,
                riderRating: request.riderRating,
                pickupAddress: request.pickupAddress,
                dropoffAddress: request.dropoffAddress,
                estimatedFareMZN: request.estimatedFareMZN,
                actualFareMZN: null,
                estimatedDurationMin: request.estimatedDurationMin,
                actualDurationMin: null,
                estimatedDistanceKm: request.estimatedDistanceKm,
                actualDistanceKm: null,
                startedAt: null,
                completedAt: null,
                riderRatingGiven: null,
                riderFeedback: null,
              },
              offerExpiresAt: expiresAt,
              offerCountdown: 30,
            };
          }
          return state;
        }),

      /**
       * Transition: OFFER_RECEIVED -> NAVIGATING_TO_PICKUP
       * Driver accepts the offer
       */
      acceptOffer: () =>
        set((state) => {
          if (state.state === 'OFFER_RECEIVED' && state.currentRideSession) {
            return {
              state: 'NAVIGATING_TO_PICKUP',
              stateHistory: [...state.stateHistory, 'NAVIGATING_TO_PICKUP'],
              offerExpiresAt: null,
              offerCountdown: 0,
            };
          }
          return state;
        }),

      /**
       * Transition: OFFER_RECEIVED -> ONLINE
       * Driver rejects the offer or countdown expires
       */
      rejectOffer: () =>
        set((state) => {
          if (state.state === 'OFFER_RECEIVED') {
            return {
              state: 'ONLINE',
              stateHistory: [...state.stateHistory, 'ONLINE'],
              currentRideSession: null,
              offerExpiresAt: null,
              offerCountdown: 0,
            };
          }
          return state;
        }),

      /**
       * Transition: NAVIGATING_TO_PICKUP -> ARRIVED_AT_PICKUP
       * Driver arrives at pickup location
       */
      arrivedAtPickup: () =>
        set((state) => {
          if (state.state === 'NAVIGATING_TO_PICKUP' && state.currentRideSession) {
            return {
              state: 'ARRIVED_AT_PICKUP',
              stateHistory: [...state.stateHistory, 'ARRIVED_AT_PICKUP'],
            };
          }
          return state;
        }),

      /**
       * Transition: ARRIVED_AT_PICKUP -> RIDE_IN_PROGRESS
       * Rider boarded the vehicle
       */
      riderOnBoard: () =>
        set((state) => {
          if (state.state === 'ARRIVED_AT_PICKUP' && state.currentRideSession) {
            return {
              state: 'RIDE_IN_PROGRESS',
              stateHistory: [...state.stateHistory, 'RIDE_IN_PROGRESS'],
              currentRideSession: {
                ...state.currentRideSession,
                startedAt: new Date(),
              },
            };
          }
          return state;
        }),

      /**
       * Transition: RIDE_IN_PROGRESS -> ARRIVED_AT_DESTINATION
       * Driver arrived at destination
       */
      arrivedAtDestination: () =>
        set((state) => {
          if (state.state === 'RIDE_IN_PROGRESS') {
            return {
              state: 'ARRIVED_AT_DESTINATION',
              stateHistory: [...state.stateHistory, 'ARRIVED_AT_DESTINATION'],
            };
          }
          return state;
        }),

      /**
       * Transition: ARRIVED_AT_DESTINATION -> TRIP_SUMMARY
       * Payment completed, proceed to rating screen
       */
      completeRide: (actualFareMZN, riderRating, feedback = '') =>
        set((state) => {
          if (state.state === 'ARRIVED_AT_DESTINATION' && state.currentRideSession) {
            const completedSession = {
              ...state.currentRideSession,
              actualFareMZN,
              completedAt: new Date(),
              riderRatingGiven: riderRating,
              riderFeedback: feedback,
            };

            return {
              state: 'TRIP_SUMMARY',
              stateHistory: [...state.stateHistory, 'TRIP_SUMMARY'],
              currentRideSession: completedSession,
              // Update stats
              stats: {
                ...state.stats,
                todaysEarningsMZN: state.stats.todaysEarningsMZN + actualFareMZN,
                totalRidesThisWeek: state.stats.totalRidesThisWeek + 1,
              },
            };
          }
          return state;
        }),

      // === NETWORK & LOCATION ===

      setConnected: (isConnected: boolean) =>
        set({
          isConnected,
        }),

      setConnectionQuality: (quality) =>
        set({
          connectionQuality: quality,
        }),

      updateLocation: (lat, lon) =>
        set({
          currentLat: lat,
          currentLon: lon,
          lastLocationUpdate: new Date(),
        }),

      // === STATS ===

      updateStats: (newStats) =>
        set((state) => ({
          stats: { ...state.stats, ...newStats },
        })),

      addToOfflineQueue: (request) =>
        set((state) => ({
          offlineRideQueue: [...state.offlineRideQueue, request],
        })),

      clearOfflineQueue: () =>
        set({
          offlineRideQueue: [],
        }),

      // === WAITING TIMER (ARRIVED_AT_PICKUP) ===

      /**
       * Start the waiting timer when driver arrives at pickup
       */
      startWaitingTimer: () =>
        set((state) => {
          if (state.state === 'ARRIVED_AT_PICKUP') {
            return {
              waitingTimer: {
                startedAt: new Date(),
                elapsedSeconds: 0,
                waitingFeeApplied: false,
                noShowCancelled: false,
              },
            };
          }
          return state;
        }),

      /**
       * Increment waiting timer every second
       */
      incrementWaitingTimer: () =>
        set((state) => {
          if (state.state === 'ARRIVED_AT_PICKUP' && state.waitingTimer.startedAt) {
            return {
              waitingTimer: {
                ...state.waitingTimer,
                elapsedSeconds: state.waitingTimer.elapsedSeconds + 1,
              },
            };
          }
          return state;
        }),

      /**
       * Stop the waiting timer (rider boarded or cancelled)
       */
      stopWaitingTimer: () =>
        set({
          waitingTimer: initialWaitingTimer,
        }),

      /**
       * Apply waiting fee to the ride fare
       */
      applyWaitingFee: (waitingFeeMZN: number) =>
        set((state) => {
          if (state.currentRideSession && !state.waitingTimer.waitingFeeApplied) {
            return {
              currentRideSession: {
                ...state.currentRideSession,
                estimatedFareMZN:
                  state.currentRideSession.estimatedFareMZN + waitingFeeMZN,
              },
              waitingTimer: {
                ...state.waitingTimer,
                waitingFeeApplied: true,
              },
            };
          }
          return state;
        }),

      /**
       * Cancel ride due to passenger no-show
       */
      cancelRideNoShow: () =>
        set((state) => {
          if (state.state === 'ARRIVED_AT_PICKUP' && state.currentRideSession) {
            return {
              state: 'ONLINE',
              stateHistory: [...state.stateHistory, 'ONLINE'],
              currentRideSession: null,
              waitingTimer: {
                ...state.waitingTimer,
                noShowCancelled: true,
              },
            };
          }
          return state;
        }),

      // === SOS SHIELD ===

      /**
       * Activate SOS shield with current location
       */
      activateSosShield: (lat: number, lon: number) =>
        set((state) => {
          if (
            state.state === 'RIDE_IN_PROGRESS' ||
            state.state === 'NAVIGATING_TO_PICKUP'
          ) {
            return {
              sosShieldActive: true,
              sosShieldLocation: { lat, lon },
            };
          }
          return state;
        }),

      /**
       * Deactivate SOS shield
       */
      deactivateSosShield: () =>
        set({
          sosShieldActive: false,
          sosShieldLocation: null,
        }),

      /**
       * Share SOS location (mock implementation)
       */
      shareSosLocation: () =>
        set((state) => {
          if (state.sosShieldActive && state.sosShieldLocation) {
            console.log('Sharing location:', state.sosShieldLocation);
            
            // MAKKO INTELLIGENCE: Emergency location sharing implementation
            const shareEmergencyLocation = async () => {
              try {
                const response = await fetch('/api/emergency/share-location', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                  },
                  body: JSON.stringify({
                    location: state.sosShieldLocation,
                    driverId: localStorage.getItem('driver_id') || 'unknown',
                    timestamp: new Date().toISOString(),
                    emergencyType: 'sos_activated'
                  })
                });
                
                if (response.ok) {
                  console.log('Emergency location shared successfully');
                  // Notify emergency contacts via SMS/Push
                  await fetch('/api/emergency/notify-contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      driverId: localStorage.getItem('driver_id') || 'unknown',
                      location: state.sosShieldLocation,
                      message: 'EMERGENCY: Driver has activated SOS. Location shared.'
                    })
                  });
                }
              } catch (error) {
                console.error('Emergency location sharing failed:', error);
                // Fallback: Store locally and retry
                localStorage.setItem('emergency_location_pending', JSON.stringify({
                  location: state.sosShieldLocation,
                  timestamp: new Date().toISOString()
                }));
              }
            };
            
            // Execute async location sharing
            shareEmergencyLocation();
            return state;
          }
          return state;
        }),

      /**
       * Record audio for SOS (mock implementation)
       */
      recordSosAudio: () =>
        set((state) => {
          if (state.sosShieldActive) {
            console.log('Recording audio for SOS');
            
            // MAKKO INTELLIGENCE: Emergency audio recording implementation
            const recordEmergencyAudio = async () => {
              try {
                // Request microphone permission
                const stream = await navigator.mediaDevices.getUserMedia({ 
                  audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                  } 
                });
                
                const mediaRecorder = new MediaRecorder(stream, {
                  mimeType: 'audio/webm;codecs=opus'
                });
                
                const audioChunks: Blob[] = [];
                
                mediaRecorder.ondataavailable = (event) => {
                  if (event.data.size > 0) {
                    audioChunks.push(event.data);
                  }
                };
                
                mediaRecorder.onstop = async () => {
                  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                  const formData = new FormData();
                  formData.append('audio', audioBlob, `emergency_${Date.now()}.webm`);
                  formData.append('driverId', localStorage.getItem('driver_id') || '');
                  formData.append('timestamp', new Date().toISOString());
                  
                  // Upload to secure cloud storage
                  try {
                    const response = await fetch('/api/emergency/upload-audio', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                      },
                      body: formData
                    });
                    
                    if (response.ok) {
                      console.log('Emergency audio uploaded successfully');
                    } else {
                      throw new Error('Audio upload failed');
                    }
                  } catch (uploadError) {
                    console.error('Audio upload failed:', uploadError);
                    // Store locally as fallback
                    const reader = new FileReader();
                    reader.onload = () => {
                      localStorage.setItem('emergency_audio_pending', reader.result as string);
                    };
                    reader.readAsDataURL(audioBlob);
                  }
                  
                  // Stop all tracks to release microphone
                  stream.getTracks().forEach(track => track.stop());
                };
                
                // Start recording (30 second limit for emergency)
                mediaRecorder.start();
                setTimeout(() => {
                  if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                  }
                }, 30000);
                
              } catch (error) {
                console.error('Audio recording failed:', error);
                // Fallback: Text-based emergency alert
                await fetch('/api/emergency/text-alert', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    driverId: localStorage.getItem('driver_id') || 'unknown',
                    message: 'EMERGENCY: Audio recording unavailable. Driver needs assistance.',
                    timestamp: new Date().toISOString()
                  })
                });
              }
            };
            
            // Execute async audio recording
            recordEmergencyAudio();
            return state;
          }
          return state;
        }),

      // === PROFILE & SETTINGS ===

      /**
       * Update vehicle details
       */
      updateVehicleDetails: (vehicle) =>
        set((state) => ({
          vehicleDetails: { ...state.vehicleDetails, ...vehicle },
        })),

      /**
       * Update weekly earnings breakdown
       */
      updateEarningsBreakdown: (earnings) =>
        set((state) => ({
          earningsBreakdown: { ...state.earningsBreakdown, ...earnings },
        })),

      /**
       * Update driver settings
       */
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),

      /**
       * Set app language
       */
      setLanguage: (language: Language) =>
        set((state) => ({
          settings: { ...state.settings, language },
        })),

      /**
       * Set profile photo URL
       */
      setProfilePhoto: (url: string) =>
        set({
          profilePhotoUrl: url,
        }),

      /**
       * Set license document URL
       */
      setLicenseDocument: (url: string) =>
        set({
          licenseDocumentUrl: url,
        }),

      // === UI ===

      /**
       * Toggle sidebar visibility
       */
      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      /**
       * Set sidebar open/closed
       */
      setSidebarOpen: (open: boolean) =>
        set({
          sidebarOpen: open,
        }),

      // === UTILITY ===

      /**
       * Decrement offer countdown (called every second)
       * If countdown reaches 0, auto-reject offer
       */
      decrementOfferCountdown: () =>
        set((state) => {
          if (state.state === 'OFFER_RECEIVED' && state.offerCountdown > 0) {
            const newCountdown = state.offerCountdown - 1;
            if (newCountdown === 0) {
              // Auto-reject
              return {
                offerCountdown: 0,
                state: 'ONLINE',
                stateHistory: [...state.stateHistory, 'ONLINE'],
                currentRideSession: null,
                offerExpiresAt: null,
              };
            }
            return { offerCountdown: newCountdown };
          }
          return state;
        }),

      reset: () =>
        set({
          state: 'OFFLINE',
          stateHistory: ['OFFLINE'],
          currentRideSession: null,
          offlineRideQueue: [],
          stats: initialStats,
          offerExpiresAt: null,
          offerCountdown: 0,
          waitingTimer: initialWaitingTimer,
          sosShieldActive: false,
          sosShieldLocation: null,
          sidebarOpen: false,
        }),
    }),
    {
      name: 'driver-store',
      partialize: (state) => ({
        // Persist these across sessions
        stats: state.stats,
        offlineRideQueue: state.offlineRideQueue,
        currentLat: state.currentLat,
        currentLon: state.currentLon,
        vehicleDetails: state.vehicleDetails,
        earningsBreakdown: state.earningsBreakdown,
        settings: state.settings,
        licenseDocumentUrl: state.licenseDocumentUrl,
        profilePhotoUrl: state.profilePhotoUrl,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Zustand rehydration error:', error);
          // Reset to initial state on error
          return;
        }
        console.log('Zustand store rehydrated successfully');
      },
    }
  )
);

// ============================================================================
// SELECTORS (For performance optimization)
// ============================================================================

export const useRideState = () =>
  useDriverStore((state) => state.state);

export const useCurrentRideSession = () =>
  useDriverStore((state) => state.currentRideSession);

export const useOfferCountdown = () =>
  useDriverStore((state) => state.offerCountdown);

export const useDriverStats = () =>
  useDriverStore((state) => state.stats);

export const useConnectionStatus = () =>
  useDriverStore((state) => ({
    isConnected: state.isConnected,
    quality: state.connectionQuality,
  }));

export const useDriverLocation = () =>
  useDriverStore((state) => ({
    lat: state.currentLat,
    lon: state.currentLon,
    lastUpdate: state.lastLocationUpdate,
  }));