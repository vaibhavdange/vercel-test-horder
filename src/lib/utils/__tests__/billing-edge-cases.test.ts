import { calculateLegalBilling, BillingConfig } from '../legal-billing';
import { CartItem } from '@/types/cart';
import { Product } from '@/types/product';

describe('Billing Edge Cases and Error Scenarios', () => {
  const defaultBillingConfig: BillingConfig = {
    defaultTaxRate: 5,
    defaultAlcoholTaxRate: 18,
    defaultServiceChargeRate: 5,
    serviceChargeEnabled: true,
    serviceChargeRate: 5,
  };

  describe('Extreme values', () => {
    it('should handle very large amounts', () => {
      const largeCartItems: CartItem[] = [
        {
          key: 'large-item',
          productId: 'product-1',
          productName: 'Expensive Item',
          basePrice: 999999999,
          quantity: 1,
          totalPrice: 999999999,
          addons: [],
        }
      ];

      const largeProducts: Product[] = [
        {
          id: 'product-1',
          name: 'Expensive Item',
          price: 999999999,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        largeCartItems,
        largeProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      expect(result.subtotal).toBe(999999999);
      expect(result.totalPayable).toBeGreaterThan(999999999);
      expect(result.totalPayable).toBeLessThan(999999999 * 1.1); // Should be reasonable
    });

    it('should handle very small amounts', () => {
      const smallCartItems: CartItem[] = [
        {
          key: 'small-item',
          productId: 'product-1',
          productName: 'Cheap Item',
          basePrice: 0.01,
          quantity: 1,
          totalPrice: 0.01,
          addons: [],
        }
      ];

      const smallProducts: Product[] = [
        {
          id: 'product-1',
          name: 'Cheap Item',
          price: 0.01,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        smallCartItems,
        smallProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      expect(result.subtotal).toBe(0.01);
      expect(result.totalPayable).toBeGreaterThan(0.01);
    });

    it('should handle zero amounts', () => {
      const zeroCartItems: CartItem[] = [
        {
          key: 'zero-item',
          productId: 'product-1',
          productName: 'Free Item',
          basePrice: 0,
          quantity: 1,
          totalPrice: 0,
          addons: [],
        }
      ];

      const zeroProducts: Product[] = [
        {
          id: 'product-1',
          name: 'Free Item',
          price: 0,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        zeroCartItems,
        zeroProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      expect(result.subtotal).toBe(0);
      expect(result.totalPayable).toBe(0);
    });
  });

  describe('Invalid inputs', () => {
    it('should handle NaN discount input', () => {
      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'product-1',
          productName: 'Test Item',
          basePrice: 100,
          quantity: 1,
          totalPrice: 100,
          addons: [],
        }
      ];

      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Test Item',
          price: 100,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        cartItems,
        products,
        'not-a-number',
        'amount',
        true,
        defaultBillingConfig
      );

      expect(result.discountAmount).toBe(0);
      expect(result.foodDiscount).toBe(0);
      expect(result.alcoholDiscount).toBe(0);
    });

    it('should handle negative discount input', () => {
      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'product-1',
          productName: 'Test Item',
          basePrice: 100,
          quantity: 1,
          totalPrice: 100,
          addons: [],
        }
      ];

      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Test Item',
          price: 100,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        cartItems,
        products,
        '-50',
        'amount',
        true,
        defaultBillingConfig
      );

      // Negative discount should be treated as 0
      expect(result.discountAmount).toBe(0);
    });

    it('should handle empty string discount input', () => {
      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'product-1',
          productName: 'Test Item',
          basePrice: 100,
          quantity: 1,
          totalPrice: 100,
          addons: [],
        }
      ];

      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Test Item',
          price: 100,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        cartItems,
        products,
        '',
        'amount',
        true,
        defaultBillingConfig
      );

      expect(result.discountAmount).toBe(0);
    });

    it('should handle null/undefined discount input', () => {
      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'product-1',
          productName: 'Test Item',
          basePrice: 100,
          quantity: 1,
          totalPrice: 100,
          addons: [],
        }
      ];

      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Test Item',
          price: 100,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        cartItems,
        products,
        null as any,
        'amount',
        true,
        defaultBillingConfig
      );

      expect(result.discountAmount).toBe(0);
    });
  });

  describe('Data consistency issues', () => {
    it('should handle cart items with missing product data', () => {
      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'missing-product',
          productName: 'Unknown Item',
          basePrice: 100,
          quantity: 1,
          totalPrice: 100,
          addons: [],
        }
      ];

      const products: Product[] = []; // Empty products array

      const result = calculateLegalBilling(
        cartItems,
        products,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      // Items without matching products should be treated as food
      expect(result.foodItems).toHaveLength(1);
      expect(result.alcoholItems).toHaveLength(0);
    });

    it('should handle products with undefined isAlcohol property', () => {
      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'product-1',
          productName: 'Test Item',
          basePrice: 100,
          quantity: 1,
          totalPrice: 100,
          addons: [],
        }
      ];

      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Test Item',
          price: 100,
          isAlcohol: undefined as any,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        cartItems,
        products,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      // Items with undefined isAlcohol should be treated as food
      expect(result.foodItems).toHaveLength(1);
      expect(result.alcoholItems).toHaveLength(0);
    });

    it('should handle cart items with zero or negative quantities', () => {
      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'product-1',
          productName: 'Test Item',
          basePrice: 100,
          quantity: 0,
          totalPrice: 0,
          addons: [],
        },
        {
          key: 'item-2',
          productId: 'product-2',
          productName: 'Test Item 2',
          basePrice: 50,
          quantity: -1,
          totalPrice: -50,
          addons: [],
        }
      ];

      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Test Item',
          price: 100,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'product-2',
          name: 'Test Item 2',
          price: 50,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        cartItems,
        products,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      expect(result.subtotal).toBe(-50); // Should handle negative totals
      expect(result.totalPayable).toBeLessThan(0);
    });
  });

  describe('Configuration edge cases', () => {
    it('should handle zero tax rates', () => {
      const zeroTaxConfig: BillingConfig = {
        defaultTaxRate: 0,
        defaultAlcoholTaxRate: 0,
        defaultServiceChargeRate: 5,
        serviceChargeEnabled: true,
        serviceChargeRate: 5,
      };

      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'product-1',
          productName: 'Test Item',
          basePrice: 100,
          quantity: 1,
          totalPrice: 100,
          addons: [],
        }
      ];

      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Test Item',
          price: 100,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 0,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        cartItems,
        products,
        '',
        'amount',
        false,
        zeroTaxConfig
      );

      expect(result.foodSGST).toBe(0);
      expect(result.foodCGST).toBe(0);
      expect(result.alcoholVAT).toBe(0);
    });

    it('should handle very high tax rates', () => {
      const highTaxConfig: BillingConfig = {
        defaultTaxRate: 100, // 100% tax
        defaultAlcoholTaxRate: 200, // 200% tax
        defaultServiceChargeRate: 5,
        serviceChargeEnabled: true,
        serviceChargeRate: 5,
      };

      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'product-1',
          productName: 'Test Item',
          basePrice: 100,
          quantity: 1,
          totalPrice: 100,
          addons: [],
        }
      ];

      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Test Item',
          price: 100,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 100,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        cartItems,
        products,
        '',
        'amount',
        false,
        highTaxConfig
      );

      // With 100% tax, the tax amount should equal the base amount
      expect(result.foodSGST).toBe(52.5); // 105 * 50% (half of 100%)
      expect(result.foodCGST).toBe(52.5); // 105 * 50% (half of 100%)
    });

    it('should handle zero service charge rate', () => {
      const zeroServiceChargeConfig: BillingConfig = {
        defaultTaxRate: 5,
        defaultAlcoholTaxRate: 18,
        defaultServiceChargeRate: 0,
        serviceChargeEnabled: true,
        serviceChargeRate: 0,
      };

      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'product-1',
          productName: 'Test Item',
          basePrice: 100,
          quantity: 1,
          totalPrice: 100,
          addons: [],
        }
      ];

      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Test Item',
          price: 100,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        cartItems,
        products,
        '',
        'amount',
        false,
        zeroServiceChargeConfig
      );

      expect(result.foodServiceCharge).toBe(0);
      expect(result.alcoholServiceCharge).toBe(0);
      expect(result.serviceChargeAmount).toBe(0);
    });
  });

  describe('Mathematical edge cases', () => {
    it('should handle division by zero in proportional discount allocation', () => {
      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'product-1',
          productName: 'Free Item',
          basePrice: 0,
          quantity: 1,
          totalPrice: 0,
          addons: [],
        }
      ];

      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Free Item',
          price: 0,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        cartItems,
        products,
        '50',
        'amount',
        true,
        defaultBillingConfig
      );

      // Should not crash and should handle zero subtotal gracefully
      expect(result.foodDiscount).toBe(0);
      expect(result.alcoholDiscount).toBe(0);
    });

    it('should handle floating point precision issues', () => {
      const cartItems: CartItem[] = [
        {
          key: 'item-1',
          productId: 'product-1',
          productName: 'Test Item',
          basePrice: 33.33,
          quantity: 3,
          totalPrice: 99.99,
          addons: [],
        }
      ];

      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Test Item',
          price: 33.33,
          isAlcohol: false,
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      const result = calculateLegalBilling(
        cartItems,
        products,
        '',
        'amount',
        false,
        defaultBillingConfig
      );

      // Should handle floating point calculations without major precision issues
      expect(result.subtotal).toBeCloseTo(99.99, 2);
      expect(result.totalPayable).toBeGreaterThan(99.99);
      expect(result.totalPayable).toBeLessThan(120);
    });
  });

  describe('Performance edge cases', () => {
    it('should handle large number of items efficiently', () => {
      const largeCartItems: CartItem[] = [];
      const largeProducts: Product[] = [];

      // Create 1000 items
      for (let i = 0; i < 1000; i++) {
        largeCartItems.push({
          key: `item-${i}`,
          productId: `product-${i}`,
          productName: `Test Item ${i}`,
          basePrice: 10,
          quantity: 1,
          totalPrice: 10,
          addons: [],
        });

        largeProducts.push({
          id: `product-${i}`,
          name: `Test Item ${i}`,
          price: 10,
          isAlcohol: i % 2 === 0, // Alternate between food and alcohol
          stockQuantity: 1,
          minStockLevel: 1,
          taxRate: 5,
          serviceChargeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const startTime = Date.now();
      const result = calculateLegalBilling(
        largeCartItems,
        largeProducts,
        '',
        'amount',
        false,
        defaultBillingConfig
      );
      const endTime = Date.now();

      expect(result.subtotal).toBe(10000); // 1000 * 10
      expect(result.foodItems).toHaveLength(500);
      expect(result.alcoholItems).toHaveLength(500);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
