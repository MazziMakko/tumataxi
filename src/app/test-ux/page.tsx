'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Check } from 'lucide-react';

/**
 * TUMA TAXI - SOVEREIGN UX TEST SUITE
 * 
 * Visual demonstration of the 60 FPS Neuro-Symbiotic Transitions
 * 
 * Test Cases:
 * 1. Bottom Sheet Animation (OFFER_RECEIVED)
 * 2. Slide-to-Confirm with Haptic Feedback
 * 3. Waiting Timer Countdown
 * 4. Spring Physics Snap-Back
 */
export default function UXTestSuite() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [fpsCounter, setFpsCounter] = useState<number>(0);

  // FPS Counter (measure animation performance)
  React.useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setFpsCounter(Math.round(frameCount * 1000 / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    const animationFrame = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-emerald-400 mb-2">
          🚀 Tuma Taxi - Sovereign UX Test Suite
        </h1>
        <p className="text-gray-400">
          Visual demonstration of 60 FPS GPU-accelerated transitions
        </p>
      </motion.div>

      {/* FPS Counter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-4 right-4 bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg border border-emerald-500/30 z-50"
      >
        <div className="text-xs text-gray-400 mb-1">Performance Monitor</div>
        <div className="flex items-center space-x-2">
          <div className={`text-3xl font-bold ${
            fpsCounter >= 58 ? 'text-emerald-400' : 
            fpsCounter >= 45 ? 'text-yellow-400' : 
            'text-red-500'
          }`}>
            {fpsCounter}
          </div>
          <div className="text-gray-400 text-sm">FPS</div>
        </div>
        <div className={`text-xs mt-1 ${
          fpsCounter >= 58 ? 'text-emerald-400' : 
          fpsCounter >= 45 ? 'text-yellow-400' : 
          'text-red-500'
        }`}>
          {fpsCounter >= 58 ? '✓ Optimal' : 
           fpsCounter >= 45 ? '⚠ Acceptable' : 
           '✗ Below Target'}
        </div>
      </motion.div>

      {/* Test Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Test 1: Bottom Sheet */}
        <TestCard
          title="Bottom Sheet Animation"
          description="OFFER_RECEIVED slide-up pattern"
          icon={<Play className="w-6 h-6" />}
          color="emerald"
          onTest={() => setActiveTest('bottomSheet')}
          active={activeTest === 'bottomSheet'}
        />

        {/* Test 2: Slide-to-Confirm */}
        <TestCard
          title="Slide-to-Confirm"
          description="Haptic feedback + snap-back physics"
          icon={<Check className="w-6 h-6" />}
          color="blue"
          onTest={() => setActiveTest('slideToConfirm')}
          active={activeTest === 'slideToConfirm'}
        />

        {/* Test 3: Waiting Timer */}
        <TestCard
          title="Waiting Timer"
          description="5-minute countdown auto-trigger"
          icon={<span className="text-2xl">⏱️</span>}
          color="yellow"
          onTest={() => setActiveTest('waitingTimer')}
          active={activeTest === 'waitingTimer'}
        />
      </div>

      {/* Test Visualization Area */}
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 min-h-[400px] relative overflow-hidden">
        {!activeTest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-gray-400"
          >
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-lg">Select a test case to begin</p>
          </motion.div>
        )}

        {/* Bottom Sheet Test */}
        {activeTest === 'bottomSheet' && (
          <BottomSheetDemo onClose={() => setActiveTest(null)} />
        )}

        {/* Slide-to-Confirm Test */}
        {activeTest === 'slideToConfirm' && (
          <SlideToConfirmDemo onClose={() => setActiveTest(null)} />
        )}

        {/* Waiting Timer Test */}
        {activeTest === 'waitingTimer' && (
          <WaitingTimerDemo onClose={() => setActiveTest(null)} />
        )}
      </div>

      {/* Technical Specs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <TechSpec
          label="GPU Acceleration"
          value="transform3d"
          status="active"
        />
        <TechSpec
          label="Animation Library"
          value="Framer Motion"
          status="active"
        />
        <TechSpec
          label="Target Device"
          value="Tecno Camon 19"
          status="active"
        />
      </motion.div>
    </div>
  );
}

// ============================================================================
// Test Card Component
// ============================================================================

interface TestCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'yellow';
  onTest: () => void;
  active: boolean;
}

function TestCard({ title, description, icon, color, onTest, active }: TestCardProps) {
  const colorMap = {
    emerald: 'border-emerald-500 bg-emerald-500/10',
    blue: 'border-blue-500 bg-blue-500/10',
    yellow: 'border-yellow-500 bg-yellow-500/10',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTest}
      className={`p-6 rounded-xl border-2 transition-all ${
        active ? colorMap[color] : 'border-gray-700 bg-gray-800'
      }`}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-lg ${active ? `bg-${color}-500/20` : 'bg-gray-700'}`}>
          {icon}
        </div>
        <h3 className="font-bold text-lg text-left">{title}</h3>
      </div>
      <p className="text-gray-400 text-sm text-left">{description}</p>
    </motion.button>
  );
}

// ============================================================================
// Bottom Sheet Demo
// ============================================================================

function BottomSheetDemo({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 200,
        mass: 0.8,
      }}
      className="absolute inset-0 bg-gradient-to-b from-black/50 to-black p-8 flex flex-col justify-end"
    >
      <div className="bg-gray-800 rounded-3xl p-6 border border-emerald-500">
        <h3 className="text-2xl font-bold text-emerald-400 mb-4">
          Bottom Sheet Animation
        </h3>
        <p className="text-gray-300 mb-6">
          This modal slides up from the bottom using spring physics.
          GPU-accelerated with <code>transform3d</code> and <code>will-change</code>.
        </p>
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-gray-700 rounded-lg p-3">
            <span className="text-gray-400">Damping</span>
            <span className="font-mono text-emerald-400">25</span>
          </div>
          <div className="flex justify-between items-center bg-gray-700 rounded-lg p-3">
            <span className="text-gray-400">Stiffness</span>
            <span className="font-mono text-emerald-400">200</span>
          </div>
          <div className="flex justify-between items-center bg-gray-700 rounded-lg p-3">
            <span className="text-gray-400">Mass</span>
            <span className="font-mono text-emerald-400">0.8</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors"
        >
          Close Demo
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Slide-to-Confirm Demo
// ============================================================================

function SlideToConfirmDemo({ onClose }: { onClose: () => void }) {
  const [completed, setCompleted] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <h3 className="text-2xl font-bold text-blue-400">Slide-to-Confirm Test</h3>
      
      <div className="w-full max-w-md">
        <motion.div
          className="relative h-20 w-full rounded-full border-2 border-blue-500 bg-gray-800 overflow-hidden"
          animate={{
            borderColor: completed ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/50 font-bold uppercase tracking-widest text-sm">
              {completed ? '✓ Confirmed' : 'Slide to Confirm'}
            </span>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setCompleted(true);
              if ('vibrate' in navigator) {
                navigator.vibrate(50);
              }
              setTimeout(() => setCompleted(false), 2000);
            }}
            className="z-10 h-16 w-16 m-2 bg-blue-500 rounded-full flex items-center justify-center"
          >
            {completed ? (
              <Check className="text-black w-8 h-8 stroke-[3]" />
            ) : (
              <span className="text-black text-2xl">→</span>
            )}
          </motion.button>
        </motion.div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-gray-400">Click the knob to test haptic feedback</p>
        <p className="text-xs text-gray-500">
          (50ms vibration pulse on Android/PWA)
        </p>
      </div>

      <button
        onClick={onClose}
        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
      >
        Close Demo
      </button>
    </div>
  );
}

// ============================================================================
// Waiting Timer Demo
// ============================================================================

function WaitingTimerDemo({ onClose }: { onClose: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  React.useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setElapsed(prev => (prev < 300 ? prev + 1 : prev));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const progressPercent = (elapsed / 300) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <h3 className="text-2xl font-bold text-yellow-400">Waiting Timer Test</h3>
      
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-6 border border-yellow-500/30">
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-yellow-400 mb-2">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <p className="text-gray-400 text-sm">
            {elapsed < 300 ? `${Math.floor((300 - elapsed) / 60)}:${((300 - elapsed) % 60).toString().padStart(2, '0')} until fee` : 'Fee Applied'}
          </p>
        </div>

        <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-4">
          <motion.div
            className={`h-full rounded-full ${
              progressPercent < 50 ? 'bg-green-400' :
              progressPercent < 80 ? 'bg-yellow-400' :
              'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {elapsed >= 300 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4"
          >
            <p className="text-red-300 text-sm font-semibold text-center">
              ⚠️ Waiting Fee: +50 MZN
            </p>
          </motion.div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-semibold transition"
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => setElapsed(0)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition"
          >
            Reset
          </button>
        </div>
      </div>

      <button
        onClick={onClose}
        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
      >
        Close Demo
      </button>
    </div>
  );
}

// ============================================================================
// Tech Spec Component
// ============================================================================

function TechSpec({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="text-gray-400 text-xs mb-1 uppercase">{label}</div>
      <div className="text-white font-bold text-lg mb-2">{value}</div>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          status === 'active' ? 'bg-emerald-400' : 'bg-gray-500'
        }`} />
        <span className="text-xs text-gray-500 uppercase">{status}</span>
      </div>
    </div>
  );
}
