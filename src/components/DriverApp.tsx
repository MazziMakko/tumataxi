'use client';

import React from 'react';
import DriverWorkflow from './DriverWorkflow';

/**
 * DriverApp - Main Container
 * Orchestrates the entire driver experience with state transitions
 * Includes waiting timer, SOS shield, sidebar navigation, and smooth animations
 */
export default function DriverApp() {
  return <DriverWorkflow />;
}
