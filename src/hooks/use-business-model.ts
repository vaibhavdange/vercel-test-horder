import { useMemo } from 'react';
import { useRegion } from './use-region';
import { useBillingConfig } from './use-billing-config';

export type BusinessModel = 'COUNTER_SERVICE' | 'FINE_DINE' | 'NO_TAX';

export interface BusinessModelConfig {
  businessModel: BusinessModel;
  isPayFirst: boolean;
  isPayLater: boolean;
  supportsSplitBill: boolean;
  showsTaxBreakdown: boolean;
  requiresProductLevelTax: boolean;
  displayNote?: string;
}

export const useBusinessModel = (): BusinessModelConfig => {
  const { currentRegion } = useRegion();
  const billingConfig = useBillingConfig();

  return useMemo(() => {
    // India-specific logic
    if (currentRegion?.id === 'india') {
      if (billingConfig.productLevelTaxEnabled) {
        return {
          businessModel: 'COUNTER_SERVICE',
          isPayFirst: true,
          isPayLater: false,
          supportsSplitBill: false,
          showsTaxBreakdown: true,
          requiresProductLevelTax: true,
          displayNote: 'Pay at counter - Product-level GST applied'
        };
      }
      
      // Check if any tax is configured
      const hasTaxConfig = billingConfig.taxEnabled && (
        billingConfig.defaultTaxRate > 0 || 
        billingConfig.taxTypes.length > 0 ||
        currentRegion?.taxRules?.some(rule => rule.isActive && rule.rate > 0)
      );
      
      if (hasTaxConfig) {
        return {
          businessModel: 'FINE_DINE',
          isPayFirst: false,
          isPayLater: true,
          supportsSplitBill: true,
          showsTaxBreakdown: false,
          requiresProductLevelTax: false,
          displayNote: 'Taxes and charges will be calculated at billing'
        };
      }
      
      // No tax configured - small cafes
      return {
        businessModel: 'NO_TAX',
        isPayFirst: true,
        isPayLater: false,
        supportsSplitBill: false,
        showsTaxBreakdown: false,
        requiresProductLevelTax: false,
        displayNote: 'No tax applicable'
      };
    }

    // UK and US - always counter service with uniform tax
    if (currentRegion?.id === 'united-kingdom' || currentRegion?.id === 'united-states') {
      return {
        businessModel: 'COUNTER_SERVICE',
        isPayFirst: true,
        isPayLater: false,
        supportsSplitBill: false,
        showsTaxBreakdown: true,
        requiresProductLevelTax: false,
        displayNote: 'Pay at counter - Tax included'
      };
    }

    // Default fallback
    return {
      businessModel: 'NO_TAX',
      isPayFirst: true,
      isPayLater: false,
      supportsSplitBill: false,
      showsTaxBreakdown: false,
      requiresProductLevelTax: false,
      displayNote: 'No tax configuration'
    };
  }, [currentRegion, billingConfig]);
};
