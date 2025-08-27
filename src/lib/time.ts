// Utilities for timezone-safe timestamp parsing from Supabase

/**
 * Parses a Supabase timestamp string safely.
 * If the string has no timezone offset, it is treated as UTC.
 */
export const parseSupabaseTimestamp = (timestamp: string): Date => {
  // Supabase `timestamp without time zone` returns ISO strings like "2025-08-27T07:57:59.177"
  // JavaScript's `new Date()` parses these as local time.
  // To treat them as UTC (which Supabase's `now()` often is), we append 'Z'.
  // This ensures consistent interpretation regardless of client's local timezone.
  if (timestamp.endsWith('Z')) {
    return new Date(timestamp);
  }
  return new Date(`${timestamp}Z`);
};

// Regional timezone parser system
export interface TimezoneConfig {
  region: string;
  timezone: string;
  offset: number; // in minutes
  description: string;
}

export const REGIONAL_TIMEZONES: Record<string, TimezoneConfig> = {
  'IN': {
    region: 'India',
    timezone: 'Asia/Kolkata',
    offset: 330, // UTC+5:30
    description: 'Indian Standard Time (IST)'
  },
  'US': {
    region: 'United States',
    timezone: 'America/New_York',
    offset: -300, // UTC-5:00 (EST)
    description: 'Eastern Standard Time (EST)'
  },
  'UK': {
    region: 'United Kingdom',
    timezone: 'Europe/London',
    offset: 0, // UTC+0:00
    description: 'Greenwich Mean Time (GMT)'
  },
  'AU': {
    region: 'Australia',
    timezone: 'Australia/Sydney',
    offset: 600, // UTC+10:00
    description: 'Australian Eastern Standard Time (AEST)'
  },
  'CA': {
    region: 'Canada',
    timezone: 'America/Toronto',
    offset: -300, // UTC-5:00 (EST)
    description: 'Eastern Standard Time (EST)'
  },
  'DE': {
    region: 'Germany',
    timezone: 'Europe/Berlin',
    offset: 60, // UTC+1:00
    description: 'Central European Time (CET)'
  },
  'FR': {
    region: 'France',
    timezone: 'Europe/Paris',
    offset: 60, // UTC+1:00
    description: 'Central European Time (CET)'
  },
  'JP': {
    region: 'Japan',
    timezone: 'Asia/Tokyo',
    offset: 540, // UTC+9:00
    description: 'Japan Standard Time (JST)'
  },
  'SG': {
    region: 'Singapore',
    timezone: 'Asia/Singapore',
    offset: 480, // UTC+8:00
    description: 'Singapore Standard Time (SST)'
  }
};

// Get current region from environment or settings
export const getCurrentRegion = (): string => {
  // Priority order:
  // 1. Environment variable
  // 2. Local storage setting
  // 3. Auto-detect from browser
  // 4. Default to 'IN'
  
  const envRegion = process.env.NEXT_PUBLIC_REGION;
  if (envRegion && REGIONAL_TIMEZONES[envRegion]) {
    return envRegion;
  }

  if (typeof window !== 'undefined') {
    const storedRegion = localStorage.getItem('app_region');
    if (storedRegion && REGIONAL_TIMEZONES[storedRegion]) {
      return storedRegion;
    }

    // Auto-detect from browser timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const detectedRegion = detectRegionFromTimezone(timezone);
    if (detectedRegion) {
      return detectedRegion;
    }
  }

  return 'IN'; // Default fallback
};

// Detect region from browser timezone
export const detectRegionFromTimezone = (timezone: string): string | null => {
  const timezoneMap: Record<string, string> = {
    'Asia/Kolkata': 'IN',
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'Europe/London': 'UK',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'Europe/Berlin': 'DE',
    'Europe/Paris': 'FR',
    'Asia/Tokyo': 'JP',
    'Asia/Singapore': 'SG'
  };

  return timezoneMap[timezone] || null;
};

// Regional timestamp parser
export const parseSupabaseTimestampRegional = (timestamp: string): Date => {
  const region = getCurrentRegion();
  const config = REGIONAL_TIMEZONES[region];
  
  if (!config) {
    // Fallback to original UTC parser
    return parseSupabaseTimestamp(timestamp);
  }

  // Parse the timestamp and adjust for regional timezone
  if (timestamp.endsWith('Z')) {
    // Already UTC, convert to regional time
    const utcDate = new Date(timestamp);
    const regionalDate = new Date(utcDate.getTime() + (config.offset * 60 * 1000));
    return regionalDate;
  } else {
    // Assume timestamp is in regional time, convert to UTC then back
    const regionalDate = new Date(timestamp);
    const utcDate = new Date(regionalDate.getTime() - (config.offset * 60 * 1000));
    return utcDate;
  }
};

// Settings management functions
export const setAppRegion = (region: string): void => {
  if (typeof window !== 'undefined' && REGIONAL_TIMEZONES[region]) {
    localStorage.setItem('app_region', region);
  }
};

export const getAppRegion = (): string => {
  return getCurrentRegion();
};

export const getAvailableRegions = (): TimezoneConfig[] => {
  return Object.values(REGIONAL_TIMEZONES);
};

// Format duration in hours, minutes, seconds
export const formatDurationHms = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  parts.push(`${minutes}m`);
  // Only show seconds if duration is less than an hour
  if (hours === 0 && minutes < 10) { // Show seconds for short durations
    parts.push(`${seconds}s`);
  }
  return parts.join(' ');
};

// Legacy function for backward compatibility
export const formatHms = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  return `${hh}${mm}:${ss}`;
}


