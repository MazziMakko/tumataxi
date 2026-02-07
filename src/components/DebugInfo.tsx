'use client';

import React, { useEffect, useState } from 'react';

/**
 * DebugInfo - Shows debugging information in development
 */
export default function DebugInfo() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setMounted(true);
      console.log('DebugInfo: Component mounted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('DebugInfo: Error during mount:', err);
    }
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs z-50 max-w-xs">
      <div className="font-bold mb-2">Debug Info</div>
      <div>Mounted: {mounted ? '✅' : '❌'}</div>
      <div>Environment: {process.env.NODE_ENV}</div>
      <div>Error: {error || 'None'}</div>
      <div>Timestamp: {new Date().toLocaleTimeString()}</div>
    </div>
  );
}