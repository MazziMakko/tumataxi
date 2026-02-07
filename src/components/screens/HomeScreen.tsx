'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDriverStore, useRideState } from '@/store/driverStore';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';
import { t, toggleLanguage } from '@/lib/i18n';

/**
 * HomeScreen (OFFLINE/ONLINE)
 * Full-screen map with animated TumaTaxi branding and stats
 */
export default function HomeScreen() {
  const state = useRideState();
  const { goOnline, goOffline, stats, receiveOffer, settings, setLanguage } = useDriverStore();
  const [isOnline, setIsOnline] = useState(state === 'ONLINE');
  const currentLanguage = settings.language;

  useEffect(() => {
    setIsOnline(state === 'ONLINE');
  }, [state]);

  const handleToggleOnline = () => {
    if (isOnline) {
      goOffline();
      setIsOnline(false);
    } else {
      goOnline();
      setIsOnline(true);
    }
  };

  const handleToggleLanguage = () => {
    const newLanguage = toggleLanguage(currentLanguage);
    setLanguage(newLanguage);
  };

  // Mock ride offer for demo
  const handleMockOffer = () => {
    receiveOffer({
      id: `ride-${Date.now()}`,
      riderId: 'rider-123',
      riderName: 'João Silva',
      riderRating: 4.9,
      pickupLat: -25.965,
      pickupLon: 32.587,
      pickupAddress: 'Avenida Julius Nyerere, Maputo',
      dropoffLat: -25.973,
      dropoffLon: 32.599,
      dropoffAddress: 'Rua de Moçambique, Catembe',
      estimatedFareMZN: 350,
      estimatedDurationMin: 15,
      estimatedDistanceKm: 8.5,
      requestedAt: new Date(),
    });
  };

  const rotatVariants = {
    animate: {
      rotate: [0, 360],
      transition: {
        duration: 4,
        ease: 'linear',
        repeat: Infinity,
      },
    },
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-gray-900 via-gray-950 to-black overflow-hidden">
      {/* TumaTaxi Logo - Animated Background Watermark */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center opacity-8 pointer-events-none"
        variants={rotatVariants}
        animate="animate"
      >
        <svg
          width="400"
          height="400"
          viewBox="0 0 200 200"
          className="filter drop-shadow-2xl"
          style={{ filter: 'brightness(0.8) contrast(1.2)' }}
        >
          <defs>
            <linearGradient id="lionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#FF8C00', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Lion mane outer */}
          <circle cx="100" cy="80" r="45" fill="url(#lionGrad)" opacity="0.7" />
          {/* Lion head */}
          <circle cx="100" cy="100" r="30" fill="url(#lionGrad)" opacity="0.9" />
          {/* Eyes */}
          <circle cx="92" cy="95" r="4" fill="white" />
          <circle cx="108" cy="95" r="4" fill="white" />
          {/* Nose */}
          <circle cx="100" cy="105" r="3" fill="black" />
        </svg>
      </motion.div>

      {/* Map Area - Semi-transparent overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-gray-950/40 flex items-center justify-center">
        <div className="text-gray-600/50 text-center pointer-events-none">
          <div className="text-4xl mb-2">🗺️</div>
          <div className="text-sm font-light">Localização em tempo real</div>
        </div>
      </div>

      {/* Top Left: Earnings & Tier Pills */}
      <motion.div
        className="absolute top-6 left-6 flex flex-col gap-3 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="bg-gradient-to-r from-green-900/60 to-emerald-900/60 border border-green-500/70 rounded-2xl px-5 py-3 backdrop-blur-lg shadow-2xl hover:shadow-green-500/30 transition-shadow"
          whileHover={{ scale: 1.05, y: -2 }}
        >
          <div className="text-green-300 text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">
            {t('home.earningsToday', currentLanguage)}
          </div>
          <div className="text-green-400 text-lg font-bold">
            {formatCurrencyMZN(stats.todaysEarningsMZN || 0)}
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-r from-amber-900/60 to-yellow-900/60 border border-amber-500/70 rounded-2xl px-5 py-3 backdrop-blur-lg shadow-2xl hover:shadow-amber-500/30 transition-shadow"
          whileHover={{ scale: 1.05, y: -2 }}
        >
          <div className="text-amber-300 text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">
            {t('home.level', currentLanguage)}
          </div>
          <div className="text-amber-300 text-lg font-bold">
            ⭐ {stats.currentTier || 'PADRÃO'}
          </div>
        </motion.div>
      </motion.div>

      {/* Top Right: Language Toggle & Demo Button */}
      <motion.div
        className="absolute top-6 right-6 z-10 flex gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={handleToggleLanguage}
          className="px-3 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold uppercase tracking-wide backdrop-blur-sm border border-purple-500/50 shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={`Switch to ${currentLanguage === 'en' ? 'Portuguese' : 'English'}`}
        >
          {currentLanguage === 'en' ? '🇵🇹' : '🇬🇧'}
        </motion.button>
        
        <motion.button
          onClick={handleMockOffer}
          className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold uppercase tracking-wide backdrop-blur-sm border border-blue-500/50 shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📲 {t('home.demoOffer', currentLanguage)}
        </motion.button>
      </motion.div>

      {/* Center: Go Online/Offline Button */}
      <motion.div
        className="absolute bottom-48 left-1/2 -translate-x-1/2 z-20 w-full max-w-xs px-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <motion.button
          onClick={handleToggleOnline}
          className={`
            w-full relative px-8 py-5 rounded-full font-bold text-lg transition-all duration-300 shadow-2xl
            ${isOnline
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-green-500/70 active:scale-95'
              : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:shadow-gray-600/50 active:scale-95'
            }
          `}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="flex items-center justify-center gap-2 text-base sm:text-lg">
            {isOnline ? '🟢' : '⭕'}
            {isOnline ? t('home.online', currentLanguage) : t('home.offline', currentLanguage)}
          </span>
          {isOnline && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-green-300"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Bottom Stats Row */}
      <motion.div
        className="absolute bottom-8 left-4 right-4 flex justify-between gap-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div
          className="flex-1 text-center backdrop-blur-md bg-white/5 border border-white/10 px-3 py-3 rounded-xl hover:bg-white/10 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">
            {t('home.rides', currentLanguage)}
          </div>
          <div className="text-white font-bold text-xl">{stats.totalRidesThisWeek || 0}</div>
        </motion.div>

        <motion.div
          className="flex-1 text-center backdrop-blur-md bg-white/5 border border-white/10 px-3 py-3 rounded-xl hover:bg-white/10 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">
            {t('home.rating', currentLanguage)}
          </div>
          <div className="text-yellow-400 font-bold text-xl">⭐ {(stats.averageRating || 5).toFixed(1)}</div>
        </motion.div>

        <motion.div
          className="flex-1 text-center backdrop-blur-md bg-white/5 border border-white/10 px-3 py-3 rounded-xl hover:bg-white/10 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">
            {t('home.status', currentLanguage)}
          </div>
          <div className={`font-bold text-xl ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>
            {isOnline ? '🟢' : '⭕'}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
