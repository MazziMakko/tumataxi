'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';

interface SlideToConfirmProps {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  color?: 'green' | 'blue' | 'red';
}

/**
 * SlideToConfirm Component - MAKKO INTELLIGENCE 60 FPS EDITION
 * 
 * Features:
 * - Framer Motion for GPU-accelerated animations (60 FPS locked)
 * - Haptic feedback for Android/PWA (Vibration API)
 * - Snap-back safety (prevents accidental confirmations)
 * - Visual progress feedback (background color transform)
 * - Afrofuturist design (Emerald Green #50C878 + Sovereign Dark)
 * 
 * UX Flow:
 * 1. Drag knob from left to right (min 80% of track width)
 * 2. Visual feedback: background shifts from dark to accent color
 * 3. Haptic pulse on success (50ms vibration)
 * 4. State transition triggered deterministically
 */
export default function SlideToConfirm({
  label,
  onConfirm,
  disabled = false,
  color = 'green',
}: SlideToConfirmProps) {
  const [isComplete, setIsComplete] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  // Framer Motion: Track horizontal drag position
  const x = useMotionValue(0);
  
  // Maximum drag distance (will be calculated dynamically)
  const maxDragDistance = 280; // Approximation for mobile screens
  
  // Transform drag position into visual feedback
  const opacity = useTransform(x, [0, maxDragDistance * 0.5], [1, 0]);
  const scale = useTransform(x, [0, maxDragDistance], [1, 1.05]);
  
  // Color mapping based on prop
  const colorMap = {
    green: { start: '#1a1a1a', end: '#50C878', icon: '#50C878', border: '#50C878' },
    blue: { start: '#1a1a1a', end: '#3b82f6', icon: '#3b82f6', border: '#3b82f6' },
    red: { start: '#1a1a1a', end: '#ef4444', icon: '#ef4444', border: '#ef4444' },
  };
  
  const colors = colorMap[color];
  const bgColor = useTransform(x, [0, maxDragDistance], [colors.start, colors.end]);

  /**
   * HAPTIC FEEDBACK TRIGGER
   * Utilizes Vibration API for Android/PWA haptic response
   * Fallback: Silent on iOS (no Vibration API support)
   */
  const triggerHapticFeedback = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      // 50ms pulse for confirmation
      navigator.vibrate(50);
    }
  };

  /**
   * Handle drag end - Determine if slide was completed
   */
  const handleDragEnd = (_: any, info: PanInfo) => {
    const dragThreshold = maxDragDistance * 0.8; // 80% of track width
    
    if (info.offset.x > dragThreshold && !disabled) {
      // SUCCESS: Trigger confirmation
      setIsComplete(true);
      triggerHapticFeedback();
      
      // Deterministic state transition (300ms delay for visual feedback)
      setTimeout(() => {
        onConfirm();
      }, 300);
    } else {
      // SNAP BACK: Reset to start position
      x.set(0);
    }
  };

  return (
    <div className="relative w-full">
      {/* Track Container */}
      <motion.div
        ref={constraintsRef}
        style={{ 
          backgroundColor: isComplete ? colors.end : bgColor,
        }}
        className={`relative h-20 w-full rounded-full border-2 p-2 overflow-hidden shadow-2xl flex items-center ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        animate={{
          borderColor: isComplete ? colors.border : 'rgba(255, 255, 255, 0.1)',
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Background Text Label (Fades Out on Drag) */}
        <motion.div
          style={{ opacity }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span className="text-white/50 font-bold uppercase tracking-widest text-sm">
            {isComplete ? '✓ Confirmed' : `Slide to ${label}`}
          </span>
        </motion.div>

        {/* Draggable Knob (GPU Accelerated) */}
        <motion.div
          drag={disabled || isComplete ? false : 'x'}
          dragConstraints={{ left: 0, right: maxDragDistance }}
          dragElastic={0.05}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ 
            x, 
            scale,
            willChange: 'transform',
          }}
          className={`z-10 h-16 w-16 rounded-full flex items-center justify-center shadow-lg ${
            disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
          }`}
          animate={{
            backgroundColor: colors.icon,
          }}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
        >
          {isComplete ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Check className="text-black w-8 h-8 stroke-[3]" />
            </motion.div>
          ) : (
            <ChevronRight className="text-black w-8 h-8 stroke-[3]" />
          )}
        </motion.div>
      </motion.div>

      {/* Helper Text (Below Slider) */}
      {!isComplete && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-gray-400 text-xs text-center mt-2"
        >
          Swipe right to confirm
        </motion.p>
      )}
    </div>
  );
}
