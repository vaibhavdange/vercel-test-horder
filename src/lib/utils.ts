import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a KOT number for display
 * @param kotNumber - The KOT number to format
 * @returns Formatted KOT number string
 */
export function formatKOTNumber(kotNumber: number): string {
  return `#${kotNumber}`;
}

/**
 * Formats a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'INR')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Tax utilities derived from Tax_Calc.md
export type TaxMenuItem = {
  id: string;
  name: string;
  price: number;
  taxRate: number; // percentage e.g., 5, 12, 18
  isAlcohol?: boolean;
};

export type TaxOrderItem = {
  id: string;
  menuItem: TaxMenuItem;
  quantity: number;
};

export function calculateOrderTotals(items: TaxOrderItem[]) {
  let subtotal = 0;
  let tax = 0;
  for (const it of items) {
    const itemSubtotal = (it.menuItem.price || 0) * (it.quantity || 0);
    const itemTax = it.menuItem.isAlcohol ? 0 : (itemSubtotal * ((it.menuItem.taxRate || 0) / 100));
    subtotal += itemSubtotal;
    tax += itemTax;
  }
  return { subtotal, tax, total: subtotal + tax };
}

export function calculateRefund(items: TaxOrderItem[], refundItemIds: Array<string>) {
  let refundAmount = 0;
  for (const it of items) {
    if (refundItemIds.includes(it.id)) {
      const itemSubtotal = (it.menuItem.price || 0) * (it.quantity || 0);
      const itemTax = it.menuItem.isAlcohol ? 0 : (itemSubtotal * ((it.menuItem.taxRate || 0) / 100));
      refundAmount += itemSubtotal + itemTax;
    }
  }
  return refundAmount;
}
