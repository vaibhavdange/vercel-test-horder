import { CartItem } from "@/types/cart";
import { Product } from "@/types/product";

export interface LegalBillingResult {
  // Food items breakdown
  foodItems: CartItem[];
  foodSubtotal: number;
  foodDiscount: number;
  foodServiceCharge: number;
  foodGrandBeforeTax: number;
  foodSGST: number;
  foodCGST: number;
  foodTotal: number;
  // Alcohol items breakdown
  alcoholItems: CartItem[];
  alcoholSubtotal: number;
  alcoholDiscount: number;
  alcoholServiceCharge: number;
  alcoholGrandBeforeTax: number;
  alcoholVAT: number;
  alcoholTotal: number;
  // Combined totals
  subtotal: number;
  discountAmount: number;
  serviceChargeAmount: number;
  totalPayable: number;
}

export interface BillingConfig {
  defaultTaxRate: number; // GST (for food)
  defaultAlcoholTaxRate: number; // VAT (for alcohol)
  defaultServiceChargeRate: number;
  serviceChargeEnabled: boolean;
  serviceChargeRate: number;
}

export function calculateLegalBilling(
  orderItems: CartItem[],
  products: Product[],
  discountInput: string,
  discountMode: "percent" | "amount",
  isDiscountEnabled: boolean,
  billingConfig: BillingConfig
): LegalBillingResult {
  // 1. Split items into food vs alcohol
  const foodItems = orderItems.filter(item => {
    const product = products.find(p => p.id === item.productId);
    return !product?.isAlcohol;
  });
  const alcoholItems = orderItems.filter(item => {
    const product = products.find(p => p.id === item.productId);
    return product?.isAlcohol;
  });
  // 2. Compute raw subtotals
  const foodSubtotal = foodItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const alcoholSubtotal = alcoholItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const subtotal = foodSubtotal + alcoholSubtotal;
  // 3. Compute discount per group (proportional for amount, direct for percent)
  let foodDiscount = 0, alcoholDiscount = 0, discountAmount = 0;
  if (isDiscountEnabled && discountInput) {
    const discountNumeric = parseFloat(discountInput);
    if (!isNaN(discountNumeric)) {
      if (discountMode === "percent") {
        foodDiscount = (discountNumeric / 100) * foodSubtotal;
        alcoholDiscount = (discountNumeric / 100) * alcoholSubtotal;
      } else {
        // Proportional allocation
        const total = foodSubtotal + alcoholSubtotal;
        foodDiscount = total > 0 ? (foodSubtotal / total) * discountNumeric : 0;
        alcoholDiscount = total > 0 ? (alcoholSubtotal / total) * discountNumeric : 0;
      }
      discountAmount = foodDiscount + alcoholDiscount;
    }
  }
  // 4. Service charge per group (from UI), on (subtotal - discount)
  let foodServiceCharge = 0, alcoholServiceCharge = 0, serviceChargeAmount = 0;
  if (billingConfig.serviceChargeEnabled) {
    foodServiceCharge = (foodSubtotal - foodDiscount) * (billingConfig.serviceChargeRate / 100);
    alcoholServiceCharge = (alcoholSubtotal - alcoholDiscount) * (billingConfig.serviceChargeRate / 100);
    serviceChargeAmount = foodServiceCharge + alcoholServiceCharge;
  }
  // 5. Grand before tax per group
  const foodGrandBeforeTax = foodSubtotal - foodDiscount + foodServiceCharge;
  const alcoholGrandBeforeTax = alcoholSubtotal - alcoholDiscount + alcoholServiceCharge;
  // 6. SGST/CGST for food (split GST rate)
  const foodSGST = foodGrandBeforeTax * (billingConfig.defaultTaxRate / 2 / 100);
  const foodCGST = foodGrandBeforeTax * (billingConfig.defaultTaxRate / 2 / 100);
  // 7. VAT for alcohol
  const alcoholVAT = alcoholGrandBeforeTax * (billingConfig.defaultAlcoholTaxRate / 100);
  // 8. Totals per group
  const foodTotal = foodGrandBeforeTax + foodSGST + foodCGST;
  const alcoholTotal = alcoholGrandBeforeTax + alcoholVAT;
  // 9. Grand total
  const totalPayable = foodTotal + alcoholTotal;
  return {
    foodItems,
    foodSubtotal,
    foodDiscount,
    foodServiceCharge,
    foodGrandBeforeTax,
    foodSGST,
    foodCGST,
    foodTotal,
    alcoholItems,
    alcoholSubtotal,
    alcoholDiscount,
    alcoholServiceCharge,
    alcoholGrandBeforeTax,
    alcoholVAT,
    alcoholTotal,
    subtotal,
    discountAmount,
    serviceChargeAmount,
    totalPayable,
  };
}
