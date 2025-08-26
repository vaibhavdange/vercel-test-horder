import { useCallback } from 'react';
import { useRestaurantStore } from '@/lib/store/restaurant-store';
import { regions, getRegionById, getRegionByCode, getDefaultRegion } from '@/lib/data/regions';
import { Region } from '@/types/restaurant';

export const useRegion = () => {
  const { settings, updateSettings } = useRestaurantStore();

  // Ensure we always have a valid region, fallback to default if needed
  // Also check if the store has been hydrated (settings should exist)
  const currentRegion = settings?.region || getDefaultRegion();

  const setRegion = useCallback((region: Region) => {
    updateSettings({ region });
  }, [updateSettings]);

  const setRegionById = useCallback((regionId: string) => {
    const region = getRegionById(regionId);
    if (region) {
      updateSettings({ region });
    }
  }, [updateSettings]);

  const setRegionByCode = useCallback((regionCode: string) => {
    const region = getRegionByCode(regionCode);
    if (region) {
      updateSettings({ region });
    }
  }, [updateSettings]);

  const getAvailableRegions = useCallback(() => {
    return regions.filter(region => region.isActive);
  }, []);

  // Ensure we always return valid regions
  const availableRegions = getAvailableRegions();

  const getRegionTaxRules = useCallback(() => {
    return currentRegion?.taxRules?.filter(rule => rule.isActive) || [];
  }, [currentRegion]);

  const getDefaultTaxRate = useCallback(() => {
    const defaultRule = currentRegion?.taxRules?.find(rule => rule.appliesTo === 'all');
    return defaultRule ? defaultRule.rate : 0;
  }, [currentRegion]);

  const formatCurrency = useCallback((amount: number) => {
    return `${currentRegion?.currencySymbol || '₹'}${amount.toFixed(2)}`;
  }, [currentRegion]);

  const formatDate = useCallback((date: Date) => {
    // This would be replaced with a proper date formatting library like date-fns
    // For now, return a simple format
    return date.toLocaleDateString();
  }, []);

  return {
    currentRegion,
    setRegion,
    setRegionById,
    setRegionByCode,
    getAvailableRegions,
    getRegionTaxRules,
    getDefaultTaxRate,
    formatCurrency,
    formatDate,
    regions: availableRegions,
  };
};
