import { useMemo } from 'react';
import { CartItem } from '@/types/cart';
import { Product } from '@/types/product';
import { BusinessModel } from './use-business-model';
import { calculateLegalBilling, BillingConfig } from '@/lib/utils/legal-billing';
import { useBillingConfig, useServiceChargeApplicable, useRoundingRules } from './use-billing-config';
import { useDefaultAlcoholTaxRate } from './use-billing-settings';

export interface OrderCalculations {
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  totalPayable: number;
  displayNote?: string;
  breakdown?: {
    foodSubtotal?: number;
    alcoholSubtotal?: number;
    foodTax?: number;
    alcoholTax?: number;
    serviceCharge?: number;
  };
}

interface UseOrderCalculationsProps {
  orderItems: CartItem[];
  products: Product[];
  businessModel: BusinessModel;
  orderType?: 'dine-in' | 'takeaway' | 'delivery';
  discountInput?: string;
  discountMode?: 'percent' | 'amount';
  isDiscountEnabled?: boolean;
}

export const useOrderCalculations = ({
  orderItems,
  products,
  businessModel,
  orderType = 'dine-in',
  discountInput = '',
  discountMode = 'percent',
  isDiscountEnabled = false
}: UseOrderCalculationsProps): OrderCalculations => {
  const { data: defaultAlcoholTaxRate = 18 } = useDefaultAlcoholTaxRate();
  const billingConfig = useBillingConfig();
  const isServiceChargeApplicable = useServiceChargeApplicable(orderType);
  const { roundAmount } = useRoundingRules();

  return useMemo(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Fine Dine mode - show only subtotal, tax calculated later
    if (businessModel === 'FINE_DINE') {
      return {
        subtotal,
        taxAmount: 0,
        serviceChargeAmount: 0,
        totalPayable: subtotal,
        displayNote: 'Taxes and charges will be calculated at billing'
      };
    }

    // No Tax mode - simple calculation
    if (businessModel === 'NO_TAX') {
      let total = subtotal;
      
      // Add service charge if enabled and applicable to this order type
      if (isServiceChargeApplicable && billingConfig.defaultServiceChargeRate > 0) {
        const serviceCharge = roundAmount(subtotal * (billingConfig.defaultServiceChargeRate / 100));
        total += serviceCharge;
        
        return {
          subtotal,
          taxAmount: 0,
          serviceChargeAmount: serviceCharge,
          totalPayable: roundAmount(total),
          displayNote: 'No tax applicable'
        };
      }

      return {
        subtotal,
        taxAmount: 0,
        serviceChargeAmount: 0,
        totalPayable: roundAmount(subtotal),
        displayNote: 'No tax applicable'
      };
    }

    // Counter Service mode - use legal billing calculation
    const legalBillingConfig: BillingConfig = {
      defaultTaxRate: billingConfig.defaultTaxRate,
      defaultAlcoholTaxRate: defaultAlcoholTaxRate,
      defaultServiceChargeRate: billingConfig.defaultServiceChargeRate,
      serviceChargeEnabled: isServiceChargeApplicable,
      serviceChargeRate: billingConfig.defaultServiceChargeRate
    };

    const legalBilling = calculateLegalBilling(
      orderItems,
      products,
      discountInput,
      discountMode,
      isDiscountEnabled,
      legalBillingConfig
    );

    return {
      subtotal: roundAmount(legalBilling.foodSubtotal + legalBilling.alcoholSubtotal),
      taxAmount: roundAmount(legalBilling.foodSGST + legalBilling.foodCGST + legalBilling.alcoholVAT),
      serviceChargeAmount: roundAmount(legalBilling.serviceChargeAmount),
      totalPayable: roundAmount(legalBilling.totalPayable),
      breakdown: {
        foodSubtotal: roundAmount(legalBilling.foodSubtotal),
        alcoholSubtotal: roundAmount(legalBilling.alcoholSubtotal),
        foodTax: roundAmount(legalBilling.foodSGST + legalBilling.foodCGST),
        alcoholTax: roundAmount(legalBilling.alcoholVAT),
        serviceCharge: roundAmount(legalBilling.serviceChargeAmount)
      }
    };
  }, [
    orderItems,
    products,
    businessModel,
    orderType,
    discountInput,
    discountMode,
    isDiscountEnabled,
    billingConfig,
    isServiceChargeApplicable,
    roundAmount,
    defaultAlcoholTaxRate
  ]);
};
