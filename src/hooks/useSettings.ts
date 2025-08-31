import { useState, useEffect } from 'react';

export interface AppSettings {
  restaurantName: string;
  location: string;
  restaurantId: string;
  storeId: string;
  currency: string;
  timezone: string;
  contactEmail: string;
  contactPhone: string;
  receiptFooter: string;
}

const defaultSettings: AppSettings = {
  restaurantName: 'HORDER',
  location: '',
  restaurantId: '',
  storeId: '',
  currency: 'INR',
  timezone: 'UTC',
  contactEmail: '',
  contactPhone: '',
  receiptFooter: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem('settings.general');
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<AppSettings>;
          setSettings({ ...defaultSettings, ...parsed });
        } else {
          // Set default timezone if available
          const tz = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone;
          if (tz) {
            setSettings(prev => ({ ...prev, timezone: tz }));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Listen for storage events (when settings are updated from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'settings.general') {
        loadSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Save to localStorage
    try {
      localStorage.setItem('settings.general', JSON.stringify(updatedSettings));
      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('settings:updated', { detail: updatedSettings }));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Update specific setting
  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    updateSettings({ [key]: value });
  };

  // Refresh settings from localStorage
  const refreshSettings = () => {
    try {
      const stored = localStorage.getItem('settings.general');
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppSettings>;
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error refreshing settings:', error);
    }
  };

  return {
    settings,
    updateSettings,
    updateSetting,
    refreshSettings,
    isLoading,
  };
}
