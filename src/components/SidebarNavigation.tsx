'use client';

import React, { useState } from 'react';
import { useDriverStore } from '@/store/driverStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, DollarSign, Settings as SettingsIcon, MapPin, Moon, Volume2 } from 'lucide-react';

type TabType = 'profile' | 'earnings' | 'settings';

/**
 * Sidebar Navigation Component
 * Hamburger menu with three main sections:
 * 1. Profile: Vehicle details, License documents
 * 2. Earnings: Weekly breakdown, Cash out button
 * 3. Settings: Map sound, Night mode toggle
 */
export default function SidebarNavigation() {
  const {
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    vehicleDetails,
    earningsBreakdown,
    settings,
    updateSettings,
    stats,
  } = useDriverStore();

  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const handleToggleSidebar = () => {
    toggleSidebar();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
  const totalWeeklyEarnings = weekDays.reduce((sum, day) => sum + earningsBreakdown[day], 0);

  const handleCashOut = () => {
    alert(`Cash out ${totalWeeklyEarnings} MZN? (Feature coming soon)`);
  };

  return (
    <>
      {/* Hamburger Toggle Button */}
      <motion.button
        onClick={handleToggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <motion.span
            animate={sidebarOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            className="w-full h-0.5 bg-white origin-left"
          />
          <motion.span
            animate={sidebarOpen ? { opacity: 0 } : { opacity: 1 }}
            className="w-full h-0.5 bg-white"
          />
          <motion.span
            animate={sidebarOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            className="w-full h-0.5 bg-white origin-left"
          />
        </div>
      </motion.button>

      {/* Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed left-0 top-0 bottom-0 w-96 bg-gray-900 border-r border-gray-700 z-40 flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'earnings', label: 'Earnings', icon: DollarSign },
                { id: 'settings', label: 'Settings', icon: SettingsIcon },
              ].map(({ id, label, icon: Icon }) => (
                <motion.button
                  key={id}
                  onClick={() => handleTabChange(id as TabType)}
                  className={`flex-1 py-4 flex items-center justify-center space-x-2 transition ${
                    activeTab === id
                      ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{label}</span>
                </motion.button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6">
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-white">Vehicle Details</h3>

                  {/* Vehicle Card */}
                  <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 space-y-3">
                    <div>
                      <div className="text-gray-400 text-sm">Make & Model</div>
                      <div className="text-white font-semibold">
                        {vehicleDetails.make} {vehicleDetails.model}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-gray-400 text-sm">Year</div>
                        <div className="text-white font-semibold">{vehicleDetails.year}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Seats</div>
                        <div className="text-white font-semibold">{vehicleDetails.seatingCapacity}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">License Plate</div>
                      <div className="text-white font-mono font-bold text-lg">{vehicleDetails.licensePlate}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Color</div>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-600"
                          style={{
                            backgroundColor: vehicleDetails.color.toLowerCase() === 'black' ? '#000' :
                            vehicleDetails.color.toLowerCase() === 'white' ? '#fff' :
                            vehicleDetails.color.toLowerCase() === 'silver' ? '#c0c0c0' :
                            vehicleDetails.color.toLowerCase() === 'blue' ? '#0066ff' : '#808080'
                          }}
                        />
                        <span className="text-white font-semibold">{vehicleDetails.color}</span>
                      </div>
                    </div>
                  </div>

                  {/* License Documents */}
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3">Documents</h4>
                    <motion.button
                      onClick={() => alert('License document viewer coming soon')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      📄 View License Document
                    </motion.button>
                  </div>

                  {/* Driver Rating */}
                  <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-4 border border-blue-700">
                    <div className="text-gray-300 text-sm mb-1">Your Rating</div>
                    <div className="text-3xl font-bold text-white">
                      ⭐ {stats.averageRating.toFixed(1)}
                    </div>
                    <div className="text-blue-200 text-xs mt-2">
                      Tier: <span className="font-bold">{stats.currentTier}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* EARNINGS TAB */}
              {activeTab === 'earnings' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-white">Weekly Earnings</h3>

                  {/* Total Earnings Card */}
                  <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-2xl p-6 border border-green-700">
                    <div className="text-green-300 text-sm mb-1">Total This Week</div>
                    <div className="text-4xl font-bold text-white mb-2">
                      {totalWeeklyEarnings.toLocaleString('pt-MZ', {
                        style: 'currency',
                        currency: 'MZN',
                      })}
                    </div>
                    <div className="text-green-200 text-xs">
                      Average: {(totalWeeklyEarnings / 7).toLocaleString('pt-MZ', {
                        style: 'currency',
                        currency: 'MZN',
                      })}/day
                    </div>
                  </div>

                  {/* Daily Breakdown */}
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3">Daily Breakdown</h4>
                    <div className="space-y-2">
                      {weekDays.map((day) => (
                        <div
                          key={day}
                          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                        >
                          <span className="text-gray-300 font-medium">{day}</span>
                          <span className="text-white font-bold">
                            {earningsBreakdown[day].toLocaleString('pt-MZ', {
                              style: 'currency',
                              currency: 'MZN',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cash Out Button */}
                  <motion.button
                    onClick={handleCashOut}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <DollarSign className="w-6 h-6" />
                    <span>Cash Out Now</span>
                  </motion.button>
                </motion.div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-white">Settings</h3>

                  {/* Map Sound Toggle */}
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Volume2 className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-white font-semibold">Map Sound</div>
                        <div className="text-gray-400 text-xs">Navigation notifications</div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() =>
                        handleSettingChange('mapSoundEnabled', !settings.mapSoundEnabled)
                      }
                      animate={{
                        backgroundColor: settings.mapSoundEnabled ? '#10b981' : '#374151',
                      }}
                      className="relative w-12 h-6 rounded-full transition"
                    >
                      <motion.div
                        animate={{ x: settings.mapSoundEnabled ? 24 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </motion.button>
                  </div>

                  {/* Night Mode Toggle */}
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Moon className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-white font-semibold">Night Mode</div>
                        <div className="text-gray-400 text-xs">Reduce screen brightness</div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() =>
                        handleSettingChange('nightModeEnabled', !settings.nightModeEnabled)
                      }
                      animate={{
                        backgroundColor: settings.nightModeEnabled ? '#a855f7' : '#374151',
                      }}
                      className="relative w-12 h-6 rounded-full transition"
                    >
                      <motion.div
                        animate={{ x: settings.nightModeEnabled ? 24 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </motion.button>
                  </div>

                  {/* Share Location Toggle */}
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-white font-semibold">Share Location</div>
                        <div className="text-gray-400 text-xs">Real-time location tracking</div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() =>
                        handleSettingChange('shareLocationEnabled', !settings.shareLocationEnabled)
                      }
                      animate={{
                        backgroundColor: settings.shareLocationEnabled ? '#10b981' : '#374151',
                      }}
                      className="relative w-12 h-6 rounded-full transition"
                    >
                      <motion.div
                        animate={{ x: settings.shareLocationEnabled ? 24 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </motion.button>
                  </div>

                  {/* Push Notifications Toggle */}
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <SettingsIcon className="w-5 h-5 text-orange-400" />
                      <div>
                        <div className="text-white font-semibold">Push Notifications</div>
                        <div className="text-gray-400 text-xs">Ride offers and updates</div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() =>
                        handleSettingChange(
                          'pushNotificationsEnabled',
                          !settings.pushNotificationsEnabled
                        )
                      }
                      animate={{
                        backgroundColor: settings.pushNotificationsEnabled ? '#f97316' : '#374151',
                      }}
                      className="relative w-12 h-6 rounded-full transition"
                    >
                      <motion.div
                        animate={{ x: settings.pushNotificationsEnabled ? 24 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </motion.button>
                  </div>

                  {/* App Version */}
                  <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 text-center">
                    <div className="text-gray-400 text-xs">App Version</div>
                    <div className="text-white font-bold text-lg">v1.0.0</div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
