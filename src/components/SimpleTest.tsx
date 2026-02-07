'use client';

import React from 'react';

/**
 * SimpleTest - Minimal component to test basic React rendering
 */
export default function SimpleTest() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">TumaTaxi Test</h1>
        <p className="text-xl">If you can see this, React is working!</p>
        <p className="text-sm mt-4">Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}