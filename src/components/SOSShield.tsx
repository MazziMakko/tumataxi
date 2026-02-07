'use client';

import React, { useState } from 'react';
import { useDriverStore } from '@/store/driverStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Share2, Phone, Mic, X } from 'lucide-react';

/**
 * SOS Shield Component
 * Floating emergency button with options to:
 * - Share Location with emergency contacts
 * - Call Police
 * - Record Audio for evidence
 */
export default function SOSShield() {
  const { state, currentLat, currentLon, sosShieldActive, activateSosShield, deactivateSosShield, shareSosLocation, recordSosAudio } = useDriverStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Only show SOS shield during active trips
  if (state !== 'RIDE_IN_PROGRESS' && state !== 'NAVIGATING_TO_PICKUP') {
    return null;
  }

  const handleSOSActivate = () => {
    if (currentLat && currentLon) {
      activateSosShield(currentLat, currentLon);
      setShowMenu(true);
    }
  };

  const handleShareLocation = () => {
    shareSosLocation();
    // Show toast notification
    console.log('Location shared with emergency contacts');
  };

  const handleCallPolice = () => {
    // In a real app, this would trigger actual emergency calling
    // For now, we'll just show a confirmation
    if (confirm('Call emergency services? Dial 119 for Mozambique Police')) {
      window.location.href = 'tel:119';
    }
  };

  const handleRecordAudio = () => {
    if (!isRecording) {
      setIsRecording(true);
      recordSosAudio();
      // Show toast: "Recording started..."
      console.log('Audio recording started');
    } else {
      setIsRecording(false);
      // Show toast: "Recording saved..."
      console.log('Audio recording stopped and saved');
    }
  };

  const handleClose = () => {
    setShowMenu(false);
    deactivateSosShield();
  };

  return (
    <>
      {/* Floating SOS Button */}
      <motion.button
        onClick={() => {
          if (!sosShieldActive) {
            handleSOSActivate();
          }
        }}
        className="fixed bottom-32 right-4 w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg flex items-center justify-center z-40 border-2 border-red-400"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={sosShieldActive ? {
          boxShadow: [
            '0 0 0 0 rgba(239, 68, 68, 0.7)',
            '0 0 0 20px rgba(239, 68, 68, 0)',
          ],
        } : {}}
        transition={{ duration: 0.5, repeat: sosShieldActive ? Infinity : 0 }}
      >
        <Shield className="w-8 h-8 text-white" />
      </motion.button>

      {/* SOS Menu Modal */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl p-6 z-50 max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-red-500" />
                  <span>Emergency Shield</span>
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-800 rounded-full transition"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Location Info */}
              <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Current Location</div>
                <div className="text-white font-mono text-sm break-all">
                  📍 {currentLat?.toFixed(4)}, {currentLon?.toFixed(4)}
                </div>
                <div className="text-green-400 text-xs mt-2">✓ Location tracking active</div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Share Location */}
                <motion.button
                  onClick={handleShareLocation}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share Location with Emergency Contacts</span>
                </motion.button>

                {/* Call Police */}
                <motion.button
                  onClick={handleCallPolice}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Police (119)</span>
                </motion.button>

                {/* Record Audio */}
                <motion.button
                  onClick={handleRecordAudio}
                  className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition ${
                    isRecording
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                  <span>{isRecording ? 'Recording...' : 'Record Audio Evidence'}</span>
                </motion.button>
              </div>

              {/* Warning Text */}
              <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-xl">
                <p className="text-red-200 text-sm">
                  ⚠️ Use this feature only in genuine emergencies. False reports may result in
                  penalties.
                </p>
              </div>

              {/* Close Button */}
              <motion.button
                onClick={handleClose}
                className="w-full mt-6 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
