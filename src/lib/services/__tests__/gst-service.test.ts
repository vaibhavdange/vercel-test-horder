import { GSTService } from '../gst-service';
import { Region } from '@/types/restaurant';
import { InvoiceItem } from '@/types/invoice';

// Mock region data
const mockIndiaRegion: Region = {
  id: 'india',
  name: 'India',
  currency: 'INR',
  currencySymbol: '₹',
  dateFormat: 'DD/MM/YYYY',
  invoiceTemplate: 'indian-gst',
  taxRules: [
    {
      id: 'food-tax',
      name: 'Food Tax',
      rate: 0.05, // 5%
      appliesTo: 'food',
      isActive: true,
    },
    {
      id: 'beverage-tax',
      name: 'Beverage Tax',
      rate: 0.18, // 18%
      appliesTo: 'beverages',
      isActive: true,
    },
    {
      id: 'service-tax',
      name: 'Service Tax',
      rate: 0.12, // 12%
      appliesTo: 'services',
      isActive: true,
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUSRegion: Region = {
  id: 'us',
  name: 'United States',
  currency: 'USD',
  currencySymbol: '$',
  dateFormat: 'MM/DD/YYYY',
  invoiceTemplate: 'us-standard',
  taxRules: [
    {
      id: 'sales-tax',
      name: 'Sales Tax',
      rate: 0.08, // 8%
      appliesTo: 'all',
      isActive: true,
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock invoice items
const mockInvoiceItems: Omit<InvoiceItem, 'id' | 'taxAmount' | 'lineTotal'>[] = [
  {
    itemId: 'item-1',
    name: 'Pizza Margherita',
    quantity: 2,
    unitPrice: 300,
    totalPrice: 600,
    hsnCode: '9963',
    taxSlab: 5,
  },
  {
    itemId: 'item-2',
    name: 'Beer',
    quantity: 3,
    unitPrice: 150,
    totalPrice: 450,
    hsnCode: '2202',
    taxSlab: 18,
  },
  {
    itemId: 'item-3',
    name: 'Service Charge',
    quantity: 1,
    unitPrice: 50,
    totalPrice: 50,
    hsnCode: '9963',
    taxSlab: 12,
  }
];

describe('GSTService', () => {
  describe('Constructor', () => {
    it('should initialize with provided region', () => {
      const gstService = new GSTService(mockIndiaRegion);
      expect(gstService).toBeInstanceOf(GSTService);
    });
  });

  describe('calculateItemGST', () => {
    let gstService: GSTService;

    beforeEach(() => {
      gstService = new GSTService(mockIndiaRegion);
    });

    it('should calculate GST for a single item correctly', () => {
      const item = mockInvoiceItems[0]; // Pizza with 5% tax
      const result = gstService.calculateItemGST(item);

      // Base amount: 2 * 300 = 600
      // Tax amount: 600 * 5% = 30
      // Line total: 600 + 30 = 630
      expect(result.taxAmount).toBe(30);
      expect(result.lineTotal).toBe(630);
    });

    it('should handle zero tax rate', () => {
      const item = { ...mockInvoiceItems[0], taxSlab: 0 };
      const result = gstService.calculateItemGST(item);

      expect(result.taxAmount).toBe(0);
      expect(result.lineTotal).toBe(600);
    });

    it('should round tax amounts to 2 decimal places', () => {
      const item = { ...mockInvoiceItems[0], unitPrice: 100, quantity: 1, taxSlab: 5 };
      const result = gstService.calculateItemGST(item);

      // Tax: 100 * 5% = 5.00
      expect(result.taxAmount).toBe(5);
      expect(result.lineTotal).toBe(105);
    });

    it('should handle fractional tax calculations', () => {
      const item = { ...mockInvoiceItems[0], unitPrice: 333.33, quantity: 1, taxSlab: 5 };
      const result = gstService.calculateItemGST(item);

      // Tax: 333.33 * 5% = 16.6665, rounded to 16.67
      expect(result.taxAmount).toBe(16.67);
      expect(result.lineTotal).toBe(350);
    });
  });

  describe('calculateTaxSummary', () => {
    let gstService: GSTService;

    beforeEach(() => {
      gstService = new GSTService(mockIndiaRegion);
    });

    it('should calculate tax summary for India (intra-state)', () => {
      const result = gstService.calculateTaxSummary(mockInvoiceItems);

      // Pizza: 600 * 5% = 30, split into CGST: 15, SGST: 15
      // Beer: 450 * 18% = 81, split into CGST: 40.5, SGST: 40.5
      // Service: 50 * 12% = 6, split into CGST: 3, SGST: 3
      // Total CGST: 15 + 40.5 + 3 = 58.5
      // Total SGST: 15 + 40.5 + 3 = 58.5
      // Total Tax: 30 + 81 + 6 = 117
      expect(result.cgstAmount).toBe(58.5);
      expect(result.sgstAmount).toBe(58.5);
      expect(result.igstAmount).toBe(0);
      expect(result.totalTaxAmount).toBe(117);
    });

    it('should calculate tax summary for non-India regions', () => {
      const usGstService = new GSTService(mockUSRegion);
      const result = usGstService.calculateTaxSummary(mockInvoiceItems);

      // For US region, all tax goes to CGST (single tax system)
      // Pizza: 600 * 5% = 30
      // Beer: 450 * 18% = 81
      // Service: 50 * 12% = 6
      // Total: 117
      expect(result.cgstAmount).toBe(117);
      expect(result.sgstAmount).toBe(0);
      expect(result.igstAmount).toBe(0);
      expect(result.totalTaxAmount).toBe(117);
    });

    it('should handle empty items array', () => {
      const result = gstService.calculateTaxSummary([]);

      expect(result.cgstAmount).toBe(0);
      expect(result.sgstAmount).toBe(0);
      expect(result.igstAmount).toBe(0);
      expect(result.totalTaxAmount).toBe(0);
    });

    it('should round tax amounts to 2 decimal places', () => {
      const fractionalItems = [
        {
          itemId: 'item-1',
          name: 'Item with fractional tax',
          quantity: 1,
          unitPrice: 333.33,
          totalPrice: 333.33,
          hsnCode: '9963',
          taxSlab: 5,
        }
      ];

      const result = gstService.calculateTaxSummary(fractionalItems);

      // Tax: 333.33 * 5% = 16.6665, split into CGST: 8.33, SGST: 8.33
      expect(result.cgstAmount).toBe(8.33);
      expect(result.sgstAmount).toBe(8.33);
      expect(result.totalTaxAmount).toBe(16.67);
    });
  });

  describe('getTaxRateForCategory', () => {
    let gstService: GSTService;

    beforeEach(() => {
      gstService = new GSTService(mockIndiaRegion);
    });

    it('should return correct tax rate for food category', () => {
      const rate = gstService.getTaxRateForCategory('food');
      expect(rate).toBe(5); // 5% converted to percentage
    });

    it('should return correct tax rate for beverages category', () => {
      const rate = gstService.getTaxRateForCategory('beverages');
      expect(rate).toBe(18); // 18% converted to percentage
    });

    it('should return correct tax rate for services category', () => {
      const rate = gstService.getTaxRateForCategory('services');
      expect(rate).toBe(12); // 12% converted to percentage
    });

    it('should return 0 for unknown category', () => {
      const rate = gstService.getTaxRateForCategory('unknown');
      expect(rate).toBe(0);
    });

    it('should handle case-insensitive category matching', () => {
      const rate1 = gstService.getTaxRateForCategory('FOOD');
      const rate2 = gstService.getTaxRateForCategory('Food');
      const rate3 = gstService.getTaxRateForCategory('food items');

      expect(rate1).toBe(5);
      expect(rate2).toBe(5);
      expect(rate3).toBe(5);
    });

    it('should return tax rate for "all" category when no specific match', () => {
      const regionWithAllTax: Region = {
        ...mockIndiaRegion,
        taxRules: [
          {
            id: 'all-tax',
            name: 'All Items Tax',
            rate: 0.10, // 10%
            appliesTo: 'all',
            isActive: true,
          }
        ]
      };

      const gstServiceWithAllTax = new GSTService(regionWithAllTax);
      const rate = gstServiceWithAllTax.getTaxRateForCategory('unknown');
      expect(rate).toBe(10);
    });
  });

  describe('getHSNCodeForCategory', () => {
    let gstService: GSTService;

    beforeEach(() => {
      gstService = new GSTService(mockIndiaRegion);
    });

    it('should return correct HSN code for food category', () => {
      const hsnCode = gstService.getHSNCodeForCategory('food');
      expect(hsnCode).toBe('9963');
    });

    it('should return correct HSN code for beverages category', () => {
      const hsnCode = gstService.getHSNCodeForCategory('beverages');
      expect(hsnCode).toBe('2202');
    });

    it('should return correct HSN code for services category', () => {
      const hsnCode = gstService.getHSNCodeForCategory('services');
      expect(hsnCode).toBe('9963');
    });

    it('should return default HSN code for unknown category', () => {
      const hsnCode = gstService.getHSNCodeForCategory('unknown');
      expect(hsnCode).toBe('9963');
    });

    it('should handle case-insensitive category matching', () => {
      const hsnCode1 = gstService.getHSNCodeForCategory('FOOD');
      const hsnCode2 = gstService.getHSNCodeForCategory('Food');
      const hsnCode3 = gstService.getHSNCodeForCategory('food items');

      expect(hsnCode1).toBe('9963');
      expect(hsnCode2).toBe('9963');
      expect(hsnCode3).toBe('9963');
    });
  });

  describe('generateInvoiceNumber', () => {
    let gstService: GSTService;

    beforeEach(() => {
      gstService = new GSTService(mockIndiaRegion);
    });

    it('should generate invoice number with correct format', () => {
      const invoiceNumber = gstService.generateInvoiceNumber();
      
      // Format: INV-YYYYMMDD-XXXX
      expect(invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
    });

    it('should generate unique invoice numbers', () => {
      const invoiceNumber1 = gstService.generateInvoiceNumber();
      const invoiceNumber2 = gstService.generateInvoiceNumber();
      
      expect(invoiceNumber1).not.toBe(invoiceNumber2);
    });

    it('should include current date in invoice number', () => {
      const now = new Date();
      const invoiceNumber = gstService.generateInvoiceNumber();
      
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const expectedDate = `${year}${month}${day}`;
      
      expect(invoiceNumber).toContain(expectedDate);
    });
  });

  describe('amountInWords', () => {
    let gstService: GSTService;

    beforeEach(() => {
      gstService = new GSTService(mockIndiaRegion);
    });

    it('should convert zero to words', () => {
      const result = gstService.amountInWords(0);
      expect(result).toBe('Zero Rupees Only');
    });

    it('should convert simple amounts to words', () => {
      const result = gstService.amountInWords(100);
      expect(result).toBe('One Hundred Rupees Only');
    });

    it('should convert amounts with paise', () => {
      const result = gstService.amountInWords(100.50);
      expect(result).toBe('One Hundred Rupees and Fifty Paise Only');
    });

    it('should convert thousands to words', () => {
      const result = gstService.amountInWords(1500);
      expect(result).toBe('One Thousand Five Hundred Rupees Only');
    });

    it('should convert lakhs to words', () => {
      const result = gstService.amountInWords(150000);
      expect(result).toBe('One Lakh Fifty Thousand Rupees Only');
    });

    it('should convert crores to words', () => {
      const result = gstService.amountInWords(15000000);
      expect(result).toBe('One Crore Fifty Lakh Rupees Only');
    });

    it('should handle complex amounts', () => {
      const result = gstService.amountInWords(1234567.89);
      expect(result).toBe('Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven Rupees and Eighty Nine Paise Only');
    });

    it('should handle fractional paise correctly', () => {
      const result = gstService.amountInWords(100.99);
      expect(result).toBe('One Hundred Rupees and Ninety Nine Paise Only');
    });
  });

  describe('Region-specific methods', () => {
    let gstService: GSTService;

    beforeEach(() => {
      gstService = new GSTService(mockIndiaRegion);
    });

    it('should return correct invoice template', () => {
      const template = gstService.getInvoiceTemplate();
      expect(template).toBe('indian-gst');
    });

    it('should return correct date format', () => {
      const dateFormat = gstService.getDateFormat();
      expect(dateFormat).toBe('DD/MM/YYYY');
    });

    it('should return correct currency symbol', () => {
      const currencySymbol = gstService.getCurrencySymbol();
      expect(currencySymbol).toBe('₹');
    });
  });

  describe('Edge cases', () => {
    let gstService: GSTService;

    beforeEach(() => {
      gstService = new GSTService(mockIndiaRegion);
    });

    it('should handle very large amounts in words', () => {
      const result = gstService.amountInWords(999999999);
      expect(result).toContain('Rupees Only');
    });

    it('should handle negative amounts gracefully', () => {
      const result = gstService.amountInWords(-100);
      expect(result).toContain('Rupees Only');
    });

    it('should handle items with zero quantity', () => {
      const zeroQuantityItem = { ...mockInvoiceItems[0], quantity: 0 };
      const result = gstService.calculateItemGST(zeroQuantityItem);
      
      expect(result.taxAmount).toBe(0);
      expect(result.lineTotal).toBe(0);
    });

    it('should handle items with zero unit price', () => {
      const zeroPriceItem = { ...mockInvoiceItems[0], unitPrice: 0 };
      const result = gstService.calculateItemGST(zeroPriceItem);
      
      expect(result.taxAmount).toBe(0);
      expect(result.lineTotal).toBe(0);
    });
  });
});
