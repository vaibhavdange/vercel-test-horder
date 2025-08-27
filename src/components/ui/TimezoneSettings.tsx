'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Settings, Check } from 'lucide-react';
import { 
  getCurrentRegion, 
  setAppRegion, 
  getAvailableRegions, 
  TimezoneConfig,
  detectRegionFromTimezone 
} from '@/lib/time';

interface TimezoneSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimezoneSettings({ isOpen, onClose }: TimezoneSettingsProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [autoDetectedRegion, setAutoDetectedRegion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentRegion = getCurrentRegion();
      setSelectedRegion(currentRegion);
      
      // Auto-detect region from browser
      if (typeof window !== 'undefined') {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const detected = detectRegionFromTimezone(timezone);
        setAutoDetectedRegion(detected);
      }
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      setAppRegion(selectedRegion);
      // Force a page reload to apply new timezone settings
      window.location.reload();
    } catch (error) {
      console.error('Failed to save timezone settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoDetect = () => {
    if (autoDetectedRegion) {
      setSelectedRegion(autoDetectedRegion);
    }
  };

  const regions = getAvailableRegions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Timezone Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Auto-detect section */}
          {autoDetectedRegion && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Auto-detected region
                  </p>
                  <p className="text-xs text-blue-600">
                    {regions.find(r => r.region === autoDetectedRegion)?.description}
                  </p>
                </div>
                <button
                  onClick={handleAutoDetect}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                >
                  Use This
                </button>
              </div>
            </div>
          )}

          {/* Region selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your Region
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {regions.map((region) => (
                <option key={region.region} value={region.region}>
                  {region.description} ({region.timezone})
                </option>
              ))}
            </select>
          </div>

          {/* Current selection info */}
          {selectedRegion && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-800">
                  Selected: {regions.find(r => r.region === selectedRegion)?.description}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                This will affect how timestamps are displayed throughout the application.
              </p>
            </div>
          )}

          {/* Info section */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Settings className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">
                  Important Note
                </p>
                <p className="text-xs text-amber-700">
                  Changing timezone settings will refresh the page to apply changes. 
                  This ensures all timestamps are displayed correctly for your region.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save & Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
