/**
 * useServiceWorker Hook
 * Register and manage service worker for offline support
 * Handles updates and push notifications
 */

'use client';

import { useEffect, useRef } from 'react';

export function useServiceWorker() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported');
      return;
    }

    // =====================================================================
    // REGISTER SERVICE WORKER
    // =====================================================================
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });

        registrationRef.current = registration;
        console.log('[PWA] Service Worker registered:', registration);

        // ===============================================================
        // LISTEN FOR UPDATES
        // ===============================================================
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              console.log('[PWA] Update available');
              promptUpdateAvailable(registration);
            }
          });
        });

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();

    // =====================================================================
    // LISTEN FOR CONTROLLER CHANGE (Update installed)
    // =====================================================================
    const handleControllerChange = () => {
      console.log('[PWA] Controller changed - reload recommended');
      // Could prompt user to reload here
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return {
    isSupported: 'serviceWorker' in navigator,
    registration: registrationRef.current,
  };
}

/**
 * Prompt user that update is available
 */
function promptUpdateAvailable(registration: ServiceWorkerRegistration) {
  const message = 'A new version of Tuma Taxi is available. Reload to update?';

  if (confirm(message)) {
    // Tell the service worker to skip waiting
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload page when new service worker becomes active
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }
}

/**
 * Request notification permission and subscribe to push
 */
export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[PWA] Push notifications not supported');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[PWA] Notification permission denied');
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    console.log('[PWA] Subscribed to push notifications:', subscription);

    // Send subscription to backend
    // await fetch('/api/push/subscribe', {
    //   method: 'POST',
    //   body: JSON.stringify(subscription),
    // });

    return subscription;
  } catch (error) {
    console.error('[PWA] Failed to subscribe to push:', error);
    return null;
  }
}

/**
 * Queue an offline action for later sync
 */
export async function queueOfflineAction(action: any) {
  if (!navigator.serviceWorker.controller) {
    console.warn('[PWA] No service worker controller');
    return;
  }

  const channel = new MessageChannel();

  navigator.serviceWorker.controller.postMessage(
    {
      type: 'QUEUE_OFFLINE_ACTION',
      payload: action,
    },
    [channel.port2]
  );

  return new Promise((resolve) => {
    channel.port1.onmessage = (event) => {
      resolve(event.data);
    };
  });
}
