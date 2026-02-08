'use client';

import React from 'react';

/**
 * SimpleTest - Minimal component to test basic React rendering
 */
export default function SimpleTest() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">
          TumaTaxi Test
        </h1>
        <p className="text-gray-300 text-lg">
          Frontend is working! ✅
        </p>
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">
            Environment: {process.env.NODE_ENV || 'unknown'}
          </p>
          <p className="text-sm text-gray-400">
            Timestamp: {new Date().toISOString()}
          </p>
        </div>
      </div>
    </div>
  );
}