import { Region, TaxRule } from '@/types/restaurant';
import { InvoiceItem, TaxSummary, GSTSlab } from '@/types/invoice';

export class GSTService {
  private region: Region;

  constructor(region: Region) {
    this.region = region;
  }

  /**
   * Calculate GST for a single item
   */
  calculateItemGST(item: Omit<InvoiceItem, 'id' | 'taxAmount' | 'lineTotal'>): {
    taxAmount: number;
    lineTotal: number;
  } {
    const baseAmount = item.quantity * item.unitPrice;
    const taxAmount = baseAmount * (item.taxSlab / 100);
    const lineTotal = baseAmount + taxAmount;

    return {
      taxAmount: Math.round(taxAmount * 100) / 100, // Round to 2 decimal places
      lineTotal: Math.round(lineTotal * 100) / 100,
    };
  }

  /**
   * Calculate tax summary for all items
   */
  calculateTaxSummary(items: Omit<InvoiceItem, 'id' | 'taxAmount' | 'lineTotal'>[]): TaxSummary {
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    items.forEach(item => {
      const { taxAmount } = this.calculateItemGST(item);
      
      if (this.region.id === 'india') {
        // For India: Split GST into CGST and SGST (intra-state)
        // For inter-state: Use IGST
        if (this.isInterStateTransaction()) {
          igstAmount += taxAmount;
        } else {
          cgstAmount += taxAmount / 2;
          sgstAmount += taxAmount / 2;
        }
      } else {
        // For other regions: Use single tax rate
        cgstAmount += taxAmount;
      }
    });

    return {
      cgstAmount: Math.round(cgstAmount * 100) / 100,
      sgstAmount: Math.round(sgstAmount * 100) / 100,
      igstAmount: Math.round(igstAmount * 100) / 100,
      totalTaxAmount: Math.round((cgstAmount + sgstAmount + igstAmount) * 100) / 100,
    };
  }

  /**
   * Check if transaction is inter-state
   */
  private isInterStateTransaction(): boolean {
    // This would typically check customer's state vs restaurant's state
    // For now, return false (intra-state)
    return false;
  }

  /**
   * Get applicable tax rate for a product category
   */
  getTaxRateForCategory(category: string): number {
    const applicableRule = this.region.taxRules.find(rule => {
      if (rule.appliesTo === 'all') return true;
      if (rule.appliesTo === 'food' && category.toLowerCase().includes('food')) return true;
      if (rule.appliesTo === 'beverages' && category.toLowerCase().includes('beverage')) return true;
      if (rule.appliesTo === 'services' && category.toLowerCase().includes('service')) return true;
      return false;
    });

    return applicableRule ? applicableRule.rate * 100 : 0; // Convert to percentage
  }

  /**
   * Get HSN code for a product category
   */
  getHSNCodeForCategory(category: string): string {
    // HSN codes for restaurant services
    const hsnCodes: Record<string, string> = {
      'food': '9963', // Restaurant services
      'beverages': '2202', // Beverages
      'services': '9963', // Restaurant services
      'default': '9963',
    };

    for (const [key, code] of Object.entries(hsnCodes)) {
      if (category.toLowerCase().includes(key)) {
        return code;
      }
    }

    return hsnCodes.default;
  }

  /**
   * Generate invoice number
   */
  generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    
    return `INV-${year}${month}${day}-${timestamp}`;
  }

  /**
   * Format amount in words (Indian numbering system)
   */
  amountInWords(amount: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertLessThanOneThousand = (num: number): string => {
      if (num === 0) return '';

      if (num < 10) return ones[num];
      if (num < 20) return teens[num - 10];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + convertLessThanOneThousand(num % 100) : '');
      
      return '';
    };

    const convert = (num: number): string => {
      if (num === 0) return 'Zero';
      if (num < 1000) return convertLessThanOneThousand(num);
      if (num < 100000) return convertLessThanOneThousand(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertLessThanOneThousand(num % 1000) : '');
      if (num < 10000000) return convertLessThanOneThousand(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convert(Math.floor(num / 100000) * 100000 + (num % 100000)) : '');
      if (num < 1000000000) return convertLessThanOneThousand(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convert(Math.floor(num / 10000000) * 10000000 + (num % 10000000)) : '');
      
      return convertLessThanOneThousand(Math.floor(num / 1000000000)) + ' Billion' + (num % 1000000000 !== 0 ? ' ' + convert(num % 1000000000) : '');
    };

    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let result = convert(rupees) + ' Rupees';
    if (paise > 0) {
      result += ' and ' + convert(paise) + ' Paise';
    }

    return result + ' Only';
  }

  /**
   * Get region-specific invoice template
   */
  getInvoiceTemplate(): string {
    return this.region.invoiceTemplate;
  }

  /**
   * Get region-specific date format
   */
  getDateFormat(): string {
    return this.region.dateFormat;
  }

  /**
   * Get region-specific currency symbol
   */
  getCurrencySymbol(): string {
    return this.region.currencySymbol;
  }
}
