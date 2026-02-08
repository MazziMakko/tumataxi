'use client';

import React from 'react';
import ClientOnly from './ClientOnly';
import LoadingScreen from './LoadingScreen';
import DebugInfo from './DebugInfo';
import DriverWorkflow from './DriverWorkflow';
import ErrorLogger from './ErrorLogger';

/**
 * DriverApp - Main Container
 * Orchestrates the entire driver experience with state transitions
 * Includes waiting timer, SOS shield, sidebar navigation, and smooth animations
 */
export default function DriverApp() {
  try {
    return (
      <>
        <ErrorLogger />
        <DebugInfo />
        <ClientOnly fallback={<LoadingScreen />}>
          <DriverWorkflow />
        </ClientOnly>
      </>
    );
  } catch (error) {
    console.error('DriverApp Error:', error);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            ⚠️ App Error
          </h1>
          <p className="text-gray-300 mb-4">
            Something went wrong loading the driver app.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-yellow-600 text-black rounded-lg font-semibold"
          >
            🔄 Reload App
          </button>
        </div>
      </div>
    );
  }
}
