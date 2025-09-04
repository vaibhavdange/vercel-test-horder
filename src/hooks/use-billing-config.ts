import { useMemo } from 'react';
import { useBillingSettings } from './use-billing-settings';
import { useRegion } from './use-region';

export interface BillingConfig {
  // Tax settings
  taxEnabled: boolean;
  productLevelTaxEnabled: boolean;
  defaultTaxRate: number;
  taxTypes: Array<{ id: string; name: string; ratePercent: number }>;
  
  // Service charge settings
  serviceChargeEnabled: boolean;
  defaultServiceChargeRate: number;
  applyToDelivery: boolean;
  applyToTakeaway: boolean;
  applyToDineIn: boolean;
  
  // Rounding settings
  roundToNearest: number;
  
  // Regional settings
  region: string;
  currency: string;
  currencySymbol: string;
}

export const useBillingConfig = (): BillingConfig => {
  const { data: billingSettings = [] } = useBillingSettings();
  const { currentRegion } = useRegion();

  return useMemo(() => {
    // Create a map of settings for easy lookup
    const settingsMap: Record<string, string> = {};
    billingSettings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    // Parse tax types from JSON
    let taxTypes: Array<{ id: string; name: string; ratePercent: number }> = [];
    try {
      if (settingsMap['tax_types']) {
        const parsed = JSON.parse(settingsMap['tax_types']);
        if (Array.isArray(parsed)) {
          taxTypes = parsed.map((t: any) => ({
            id: String(t.id || `${Date.now()}_${Math.random().toString(36).slice(2,8)}`),
            name: String(t.name || ''),
            ratePercent: Number(t.ratePercent || 0)
          }));
        }
      }
    } catch (error) {
      console.error('Error parsing tax types:', error);
    }

    return {
      // Tax settings
      taxEnabled: settingsMap['tax_enabled'] === 'true',
      productLevelTaxEnabled: settingsMap['product_level_tax_enabled'] === 'true',
      defaultTaxRate: parseFloat(settingsMap['default_tax_rate'] || '0'),
      taxTypes,
      
      // Service charge settings
      serviceChargeEnabled: settingsMap['service_charge_enabled'] === 'true',
      defaultServiceChargeRate: parseFloat(settingsMap['default_service_charge_rate'] || '0'),
      applyToDelivery: settingsMap['apply_to_delivery'] === 'true',
      applyToTakeaway: settingsMap['apply_to_takeaway'] === 'true',
      applyToDineIn: settingsMap['apply_to_dine_in'] === 'true',
      
      // Rounding settings
      roundToNearest: parseFloat(settingsMap['round_to_nearest'] || '0'),
      
      // Regional settings
      region: currentRegion?.id || 'india',
      currency: currentRegion?.currency || 'INR',
      currencySymbol: currentRegion?.currencySymbol || '₹'
    };
  }, [billingSettings, currentRegion]);
};

// Helper hook to check if service charge should be applied to specific order type
export const useServiceChargeApplicable = (orderType: 'dine-in' | 'takeaway' | 'delivery') => {
  const config = useBillingConfig();
  
  return useMemo(() => {
    if (!config.serviceChargeEnabled) return false;
    
    switch (orderType) {
      case 'dine-in':
        return config.applyToDineIn;
      case 'takeaway':
        return config.applyToTakeaway;
      case 'delivery':
        return config.applyToDelivery;
      default:
        return false;
    }
  }, [config, orderType]);
};

// Helper hook for region-specific rounding
export const useRoundingRules = () => {
  const config = useBillingConfig();
  
  return useMemo(() => {
    const getRegionRoundingRule = (region: string): number => {
      switch (region) {
        case 'india':
          return 1; // Round to nearest ₹1
        case 'united-kingdom':
        case 'united-states':
          return 0.01; // Round to nearest £0.01 or $0.01
        default:
          return 0.01; // Default to 1 cent
      }
    };

    const roundAmount = (amount: number): number => {
      // Use custom rounding if specified, otherwise use region-specific rounding
      const roundingValue = config.roundToNearest > 0 ? config.roundToNearest : getRegionRoundingRule(config.region);
      
      if (roundingValue <= 0) return amount;
      
      // Round to nearest specified value
      return Math.round(amount / roundingValue) * roundingValue;
    };

    const formatAmount = (amount: number): string => {
      const rounded = roundAmount(amount);
      
      // Format based on region
      switch (config.region) {
        case 'india':
          return `₹${rounded.toFixed(0)}`; // No decimal places for India
        case 'united-kingdom':
          return `£${rounded.toFixed(2)}`;
        case 'united-states':
          return `$${rounded.toFixed(2)}`;
        default:
          return `${config.currencySymbol}${rounded.toFixed(2)}`;
      }
    };

    return {
      roundAmount,
      formatAmount,
      roundToNearest: config.roundToNearest > 0 ? config.roundToNearest : getRegionRoundingRule(config.region),
      region: config.region
    };
  }, [config.roundToNearest, config.region, config.currencySymbol]);
};
