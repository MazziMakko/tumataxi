'use client';

import DriverApp from '@/components/DriverApp';
import SimpleTest from '@/components/SimpleTest';

export default function Home() {
  // Debug mode: Set to true to show simple test, false for full app
  const debugMode = false;
  
  if (debugMode) {
    return <SimpleTest />;
  }
  
  return <DriverApp />;
}
