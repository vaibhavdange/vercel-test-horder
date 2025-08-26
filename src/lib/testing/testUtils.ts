import { NextRequest } from 'next/server';

// Mock data generators for testing
export const mockData = {
  product: {
    id: 'test-product-1',
    name: 'Test Product',
    description: 'A test product for testing',
    price: 9.99,
    cost: 5.00,
    stockQuantity: 100,
    minStockLevel: 10,
    taxRate: 0.05,
    categoryId: 'test-category-1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  category: {
    id: 'test-category-1',
    name: 'Test Category',
    description: 'A test category for testing',
    icon: '🍽️',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  order: {
    id: 'test-order-1',
    orderNumber: 'ORD-2024-001',
    orderType: 'dine-in' as const,
    tableNumber: '01',
    customerId: 'test-customer-1',
    customerName: 'Test Customer',
    customerPhone: '+1234567890',
    status: 'pending' as const,
    subStatus: 'Order Created',
    subtotal: 19.98,
    taxAmount: 0.99,
    discountAmount: 0,
    totalAmount: 20.97,
    paymentStatus: 'pending' as const,
    notes: 'Test order',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  customer: {
    id: 'test-customer-1',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+1234567890',
    address: '123 Test St, Test City, TC 12345',
    loyaltyPoints: 0,
    totalPurchases: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

// Mock request generator
export function createMockRequest(
  method: string = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): NextRequest {
  const url = 'http://localhost:3000/api/test';
  
  return new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

// Test assertion utilities
export class TestAssertion {
  static equal(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }
  
  static notEqual(actual: any, expected: any, message?: string): void {
    if (actual === expected) {
      throw new Error(message || `Expected not ${expected}, but got ${actual}`);
    }
  }
  
  static isTrue(condition: boolean, message?: string): void {
    if (!condition) {
      throw new Error(message || 'Expected condition to be true');
    }
  }
  
  static isFalse(condition: boolean, message?: string): void {
    if (condition) {
      throw new Error(message || 'Expected condition to be false');
    }
  }
  
  static isNull(value: any, message?: string): void {
    if (value !== null) {
      throw new Error(message || `Expected null, but got ${value}`);
    }
  }
  
  static isNotNull(value: any, message?: string): void {
    if (value === null) {
      throw new Error(message || 'Expected not null');
    }
  }
  
  static isUndefined(value: any, message?: string): void {
    if (value !== undefined) {
      throw new Error(message || `Expected undefined, but got ${value}`);
    }
  }
  
  static isDefined(value: any, message?: string): void {
    if (value === undefined) {
      throw new Error(message || 'Expected defined value');
    }
  }
  
  static throws(fn: () => any, message?: string): void {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (error) {
      // Function threw as expected
    }
  }
  
  static doesNotThrow(fn: () => any, message?: string): void {
    try {
      fn();
    } catch (error) {
      throw new Error(message || `Expected function not to throw, but it threw: ${error}`);
    }
  }
}

// Test runner
export class TestRunner {
  private tests: Array<{ name: string; fn: () => void }> = [];
  private passed = 0;
  private failed = 0;
  private errors: Array<{ test: string; error: Error }> = [];

  test(name: string, fn: () => void): void {
    this.tests.push({ name, fn });
  }

  async run(): Promise<{ passed: number; failed: number; errors: Array<{ test: string; error: Error }> }> {
    console.log(`\n🧪 Running ${this.tests.length} tests...\n`);
    
    for (const test of this.tests) {
      try {
        test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.error(`   Error: ${error instanceof Error ? error.message : error}`);
        this.failed++;
        this.errors.push({ test: test.name, error: error instanceof Error ? error : new Error(String(error)) });
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total: ${this.tests.length}`);

    if (this.failed > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.errors.forEach(({ test, error }) => {
        console.log(`   ${test}: ${error.message}`);
      });
    }

    return {
      passed: this.passed,
      failed: this.failed,
      errors: this.errors
    };
  }
}

// Export commonly used testing utilities
export const { equal, notEqual, isTrue, isFalse, isNull, isNotNull, isUndefined, isDefined, throws, doesNotThrow } = TestAssertion;
