'use client';

import React, { useRef, useState } from 'react';

interface SlideToConfirmProps {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  color?: 'green' | 'blue' | 'red';
}

/**
 * SlideToConfirm Component
 * Prevents accidental taps - requires swipe to confirm action
 */
export default function SlideToConfirm({
  label,
  onConfirm,
  disabled = false,
  color = 'green',
}: SlideToConfirmProps) {
  const [slided, setSlided] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || slided) return;

    const touch = e.touches[0];
    const startX = touch.clientX;
    const track = trackRef.current;
    if (!track) return;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentX = moveEvent.touches[0].clientX;
      const diffX = currentX - startX;
      const trackWidth = track.offsetWidth;
      const maxDiff = trackWidth - 60; // thumb width is ~60px

      if (diffX >= maxDiff * 0.8) {
        // 80% threshold to complete
        setSlided(true);
        onConfirm();
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      // Reset if not fully slided
      if (!slided) {
        setSlided(false);
      }
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || slided) return;

    const startX = e.clientX;
    const track = trackRef.current;
    if (!track) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const diffX = currentX - startX;
      const trackWidth = track.offsetWidth;
      const maxDiff = trackWidth - 60;

      if (diffX >= maxDiff * 0.8) {
        setSlided(true);
        onConfirm();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (!slided) {
        setSlided(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const colorClasses = {
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    red: 'bg-red-600',
  };

  return (
    <div
      ref={trackRef}
      className={`relative w-full h-16 rounded-full border-2 border-gray-600 overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${slided ? colorClasses[color] : 'bg-gray-800'}`}
      onTouchStart={handleTouchStart}
      onMouseDown={handleMouseDown}
    >
      {/* Track background */}
      <div className={`absolute inset-0 ${slided ? colorClasses[color] : 'bg-gray-800'} opacity-10`} />

      {/* Text label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`font-bold text-lg ${slided ? 'text-white' : 'text-gray-400'}`}>
          {slided ? '✓ Confirmed' : `← Swipe: ${label}`}
        </span>
      </div>

      {/* Thumb slider */}
      <div
        ref={thumbRef}
        className={`absolute top-1 left-1 w-14 h-14 rounded-full ${colorClasses[color]} shadow-lg transition-all duration-200 flex items-center justify-center text-white font-bold text-2xl ${
          slided ? 'translate-x-[calc(100vw-120px)]' : ''
        }`}
      >
        {slided ? '✓' : '→'}
      </div>
    </div>
  );
}
