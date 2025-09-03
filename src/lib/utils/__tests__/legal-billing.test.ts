import { calculateLegalBilling, BillingConfig, LegalBillingResult } from '../legal-billing';
import { CartItem } from '@/types/cart';
import { Product } from '@/types/product';

// Mock data for testing
const mockProducts: Product[] = [
  {
    id: 'food-1',
    name: 'Pizza Margherita',
    price: 300,
    isAlcohol: false,
    stockQuantity: 10,
    minStockLevel: 2,
    taxRate: 5,
    serviceChargeRate: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'alcohol-1',
    name: 'Beer',
    price: 150,
    isAlcohol: true,
    stockQuantity: 20,
    minStockLevel: 5,
    taxRate: 18,
    serviceChargeRate: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'food-2',
    name: 'Pasta',
    price: 250,
    isAlcohol: false,
    stockQuantity: 15,
    minStockLevel: 3,
    taxRate: 5,
    serviceChargeRate: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const mockCartItems: CartItem[] = [
  {
    key: 'food-1-1',
    productId: 'food-1',
    productName: 'Pizza Margherita',
    basePrice: 300,
    quantity: 2,
    totalPrice: 600,
    addons: [],
  },
  {
    key: 'alcohol-1-1',
    productId: 'alcohol-1',
    productName: 'Beer',
    basePrice: 150,
    quantity: 3,
    totalPrice: 450,
    addons: [],
  },
  {
    key: 'food-2-1',
    productId: 'food-2',
    productName: 'Pasta',
    basePrice: 250,
    quantity: 1,
    totalPrice: 250,
    addons: [],
  }
];

const defaultBillingConfig: BillingConfig = {
  defaultTaxRate: 5, // 5% GST for food
  defaultAlcoholTaxRate: 18, // 18% VAT for alcohol
  defaultServiceChargeRate: 5,
  serviceChargeEnabled: true,
  serviceChargeRate: 5,
};

describe('calculateLegalBilling', () => {
  describe('Basic calculations without discount', () => {
    it('should calculate correct subtotals for food and alcohol items', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      // Food items: Pizza (600) + Pasta (250) = 850
      expect(result.foodSubtotal).toBe(850);
      // Alcohol items: Beer (450)
      expect(result.alcoholSubtotal).toBe(450);
      // Total subtotal
      expect(result.subtotal).toBe(1300);
    });

    it('should calculate service charges correctly', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      // Service charge on food: 850 * 5% = 42.5
      expect(result.foodServiceCharge).toBe(42.5);
      // Service charge on alcohol: 450 * 5% = 22.5
      expect(result.alcoholServiceCharge).toBe(22.5);
      // Total service charge
      expect(result.serviceChargeAmount).toBe(65);
    });

    it('should calculate taxes correctly', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      // Food grand before tax: 850 + 42.5 = 892.5
      expect(result.foodGrandBeforeTax).toBe(892.5);
      // Food SGST: 892.5 * 2.5% = 22.3125
      expect(result.foodSGST).toBe(22.3125);
      // Food CGST: 892.5 * 2.5% = 22.3125
      expect(result.foodCGST).toBe(22.3125);

      // Alcohol grand before tax: 450 + 22.5 = 472.5
      expect(result.alcoholGrandBeforeTax).toBe(472.5);
      // Alcohol VAT: 472.5 * 18% = 85.05
      expect(result.alcoholVAT).toBe(85.05);
    });

    it('should calculate final totals correctly', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      // Food total: 892.5 + 22.3125 + 22.3125 = 937.125
      expect(result.foodTotal).toBe(937.125);
      // Alcohol total: 472.5 + 85.05 = 557.55
      expect(result.alcoholTotal).toBe(557.55);
      // Total payable: 937.125 + 557.55 = 1494.675
      expect(result.totalPayable).toBe(1494.675);
    });
  });

  describe('Discount calculations', () => {
    it('should apply percentage discount correctly', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '10', // 10% discount
        'percent',
        true,
        defaultBillingConfig
      );

      // Food discount: 850 * 10% = 85
      expect(result.foodDiscount).toBe(85);
      // Alcohol discount: 450 * 10% = 45
      expect(result.alcoholDiscount).toBe(45);
      // Total discount
      expect(result.discountAmount).toBe(130);
    });

    it('should apply amount discount proportionally', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '100', // 100 amount discount
        'amount',
        true,
        defaultBillingConfig
      );

      // Food proportion: 850/1300 * 100 = 65.38
      expect(result.foodDiscount).toBeCloseTo(65.38, 2);
      // Alcohol proportion: 450/1300 * 100 = 34.62
      expect(result.alcoholDiscount).toBeCloseTo(34.62, 2);
      // Total discount
      expect(result.discountAmount).toBe(100);
    });

    it('should calculate service charge after discount', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '100', // 100 amount discount
        'amount',
        true,
        defaultBillingConfig
      );

      // Food service charge: (850 - 65.38) * 5% = 39.23
      expect(result.foodServiceCharge).toBeCloseTo(39.23, 2);
      // Alcohol service charge: (450 - 34.62) * 5% = 20.77
      expect(result.alcoholServiceCharge).toBeCloseTo(20.77, 2);
    });
  });

  describe('Service charge disabled', () => {
    it('should not apply service charges when disabled', () => {
      const configWithoutServiceCharge: BillingConfig = {
        ...defaultBillingConfig,
        serviceChargeEnabled: false,
        serviceChargeRate: 0,
      };

      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '',
        'amount',
        false,
        configWithoutServiceCharge
      );

      expect(result.foodServiceCharge).toBe(0);
      expect(result.alcoholServiceCharge).toBe(0);
      expect(result.serviceChargeAmount).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty cart items', () => {
      const result = calculateLegalBilling(
        [],
        mockProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      expect(result.foodItems).toEqual([]);
      expect(result.alcoholItems).toEqual([]);
      expect(result.subtotal).toBe(0);
      expect(result.totalPayable).toBe(0);
    });

    it('should handle products not found in cart items', () => {
      const cartItemsWithUnknownProduct: CartItem[] = [
        {
          key: 'unknown-1',
          productId: 'unknown-product',
          productName: 'Unknown Item',
          basePrice: 100,
          quantity: 1,
          totalPrice: 100,
          addons: [],
        }
      ];

      const result = calculateLegalBilling(
        cartItemsWithUnknownProduct,
        mockProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      // Items without matching products should be treated as food
      expect(result.foodItems).toHaveLength(1);
      expect(result.alcoholItems).toHaveLength(0);
    });

    it('should handle invalid discount input', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        'invalid', // Invalid discount
        'amount',
        true,
        defaultBillingConfig
      );

      expect(result.foodDiscount).toBe(0);
      expect(result.alcoholDiscount).toBe(0);
      expect(result.discountAmount).toBe(0);
    });

    it('should handle zero discount', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '0',
        'amount',
        true,
        defaultBillingConfig
      );

      expect(result.foodDiscount).toBe(0);
      expect(result.alcoholDiscount).toBe(0);
      expect(result.discountAmount).toBe(0);
    });

    it('should handle discount larger than subtotal', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '2000', // Discount larger than subtotal
        'amount',
        true,
        defaultBillingConfig
      );

      // Should still apply the full discount amount
      expect(result.discountAmount).toBe(2000);
      expect(result.foodDiscount).toBeCloseTo(1307.69, 2); // 850/1300 * 2000
      expect(result.alcoholDiscount).toBeCloseTo(692.31, 2); // 450/1300 * 2000
    });
  });

  describe('Item categorization', () => {
    it('should correctly separate food and alcohol items', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      expect(result.foodItems).toHaveLength(2);
      expect(result.foodItems.map(item => item.productName)).toEqual(['Pizza Margherita', 'Pasta']);
      
      expect(result.alcoholItems).toHaveLength(1);
      expect(result.alcoholItems.map(item => item.productName)).toEqual(['Beer']);
    });

    it('should handle items with undefined isAlcohol property', () => {
      const productsWithUndefinedAlcohol: Product[] = [
        {
          ...mockProducts[0],
          isAlcohol: undefined,
        }
      ];

      const result = calculateLegalBilling(
        [mockCartItems[0]],
        productsWithUndefinedAlcohol,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      // Items with undefined isAlcohol should be treated as food
      expect(result.foodItems).toHaveLength(1);
      expect(result.alcoholItems).toHaveLength(0);
    });
  });

  describe('Return value structure', () => {
    it('should return all required fields', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      // Check all required fields are present
      expect(result).toHaveProperty('foodItems');
      expect(result).toHaveProperty('foodSubtotal');
      expect(result).toHaveProperty('foodDiscount');
      expect(result).toHaveProperty('foodServiceCharge');
      expect(result).toHaveProperty('foodGrandBeforeTax');
      expect(result).toHaveProperty('foodSGST');
      expect(result).toHaveProperty('foodCGST');
      expect(result).toHaveProperty('foodTotal');
      expect(result).toHaveProperty('alcoholItems');
      expect(result).toHaveProperty('alcoholSubtotal');
      expect(result).toHaveProperty('alcoholDiscount');
      expect(result).toHaveProperty('alcoholServiceCharge');
      expect(result).toHaveProperty('alcoholGrandBeforeTax');
      expect(result).toHaveProperty('alcoholVAT');
      expect(result).toHaveProperty('alcoholTotal');
      expect(result).toHaveProperty('subtotal');
      expect(result).toHaveProperty('discountAmount');
      expect(result).toHaveProperty('serviceChargeAmount');
      expect(result).toHaveProperty('totalPayable');
    });

    it('should return correct data types', () => {
      const result = calculateLegalBilling(
        mockCartItems,
        mockProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      expect(Array.isArray(result.foodItems)).toBe(true);
      expect(Array.isArray(result.alcoholItems)).toBe(true);
      expect(typeof result.foodSubtotal).toBe('number');
      expect(typeof result.alcoholSubtotal).toBe('number');
      expect(typeof result.totalPayable).toBe('number');
    });
  });
});
