/**
 * HUD Components (Heads-Up Display)
 * Top-left: Today's Earnings
 * Top-right: Activity Score
 * Middle-top: Tier Progress Bar
 */

'use client';

import React from 'react';
import { useDriverStats } from '@/store/driverStore';
import { DollarSign, TrendingUp, Award } from 'lucide-react';

// ============================================================================
// EARNINGS DISPLAY (TOP LEFT)
// ============================================================================

export const EarningsHUD: React.FC = () => {
  const { todaysEarningsMZN } = useDriverStats();

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-green-500 border-opacity-40 rounded-lg p-4 shadow-lg backdrop-blur-sm">
        {/* Label */}
        <div className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
          <DollarSign className="w-3 h-3" />
          Today's Earnings
        </div>

        {/* Amount */}
        <div className="text-2xl font-bold text-green-400 font-mono">
          {todaysEarningsMZN.toLocaleString('pt-MZ', {
            style: 'currency',
            currency: 'MZN',
            minimumFractionDigits: 2,
          })}
        </div>

        {/* Trend */}
        <div className="text-xs text-gray-500 mt-1">
          {todaysEarningsMZN > 0 ? (
            <span className="text-green-500">↑ Up from yesterday</span>
          ) : (
            <span className="text-gray-400">No rides yet</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ACTIVITY SCORE (TOP RIGHT)
// ============================================================================

export const ActivityScoreHUD: React.FC = () => {
  const { activityScore, averageRating, totalRidesThisWeek } = useDriverStats();

  // Color based on activity level
  const getActivityColor = (score: number) => {
    if (score >= 85) return 'from-green-600 to-green-700';
    if (score >= 70) return 'from-blue-600 to-blue-700';
    if (score >= 50) return 'from-yellow-600 to-yellow-700';
    return 'from-red-600 to-red-700';
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-blue-500 border-opacity-40 rounded-lg p-4 shadow-lg backdrop-blur-sm max-w-xs">
        {/* Label */}
        <div className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
          <TrendingUp className="w-3 h-3" />
          Activity Score
        </div>

        {/* Score Circle */}
        <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getActivityColor(activityScore)} flex items-center justify-center shadow-lg mb-3`}>
          <div className="absolute inset-1 bg-gray-900 rounded-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{activityScore}</div>
              <div className="text-xs text-gray-400">%</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Rating</span>
            <span className="text-yellow-400 font-semibold flex items-center gap-1">
              ★ {averageRating.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">This Week</span>
            <span className="text-white font-semibold">{totalRidesThisWeek} rides</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TIER PROGRESS BAR
// ============================================================================

export const TierProgressBar: React.FC = () => {
  const { currentTier, totalRidesThisWeek, nextTierRidesNeeded } = useDriverStats();

  // Calculate progress
  const progressPercent = Math.min((totalRidesThisWeek / nextTierRidesNeeded) * 100, 100);
  const ridesRemaining = Math.max(nextTierRidesNeeded - totalRidesThisWeek, 0);

  // Tier info
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'SILVER':
        return { color: 'from-slate-400 to-slate-500', nextTier: 'GOLD', requirement: '100 rides/week' };
      case 'GOLD':
        return { color: 'from-yellow-400 to-yellow-500', nextTier: 'PLATINUM', requirement: 'Max tier' };
      default:
        return { color: 'from-orange-500 to-orange-600', nextTier: 'SILVER', requirement: '50 rides/week' };
    }
  };

  const tierInfo = getTierInfo(currentTier);

  return (
    <div className="absolute top-20 left-4 right-4 z-10 mx-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-purple-500 border-opacity-40 rounded-lg p-3 shadow-lg backdrop-blur-sm">
        {/* Tier Title */}
        <div className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
          <Award className="w-3 h-3" />
          Tier Progress: {currentTier}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
          <div
            className={`bg-gradient-to-r ${tierInfo.color} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Info Row */}
        <div className="flex justify-between items-center text-xs">
          <div>
            <span className="text-gray-400">
              {totalRidesThisWeek} / {nextTierRidesNeeded} rides
            </span>
          </div>
          <div className="text-right">
            {ridesRemaining > 0 ? (
              <span className="text-blue-400 font-semibold">
                {ridesRemaining} more for {tierInfo.nextTier}
              </span>
            ) : (
              <span className="text-green-400 font-semibold">Next tier unlocked!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// OFFLINE BANNER
// ============================================================================

export const OfflineBanner: React.FC = () => {
  return (
    <div className="absolute top-40 left-4 right-4 z-10 mx-4">
      <div className="bg-red-900 border border-red-600 rounded-lg p-3 shadow-lg flex items-center gap-2">
        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
        <div className="text-sm text-red-200">
          <strong>No Connection:</strong> Requests queued. Will sync when online.
        </div>
      </div>
    </div>
  );
};
