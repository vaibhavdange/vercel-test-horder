export type PaperSize = '58' | '80';

export interface BillBusinessInfo {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
  fssai?: string;
  logoDataUrl?: string; // base64 image
}

export interface BillTaxConfig {
  showSplitGST?: boolean; // CGST/SGST split
  gstRatePercent?: number; // e.g., 5
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number; // if provided, show IGST instead of split
  lines?: Array<{ name: string; amount: number }>; // multiple tax lines (e.g., CGST, SGST, VAT)
}

export interface BillExtrasConfig {
  showPaymentDetails?: boolean;
  paymentMethod?: string;
  paymentReference?: string;
  changeDue?: number;
  balanceDue?: number; // for partial
  cashReceived?: number; // amount received in cash
  qrDataUrl?: string; // optional QR image data
  barcodeDataUrl?: string; // optional barcode image data
}

export interface BillFooterConfig {
  thankYouText?: string;
  policyText?: string;
  customNote?: string;
}

export interface GenerateBillOptions {
  paper?: PaperSize; // '58' or '80'
  dateTimeFormat?: string; // e.g., 'DD/MM/YYYY HH:mm'
}

export interface BillOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  hsn?: string;
  notes?: string;
}

export interface BillOrderData {
  id: string;
  orderNumber?: string;
  kotNumber?: number;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  isPaid?: boolean;
  notes?: string;
  items: BillOrderItem[];
  business?: BillBusinessInfo;
  tax?: BillTaxConfig;
  extras?: BillExtrasConfig;
  footer?: BillFooterConfig;
}

const inr = (n: number = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);
const inrPlain = (n: number = 0) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const amountInWords = (num: number) => {
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const words = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return `${b[Math.floor(n/10)]}${n%10?` ${a[n%10]}`:""}`;
    if (n < 1000) return `${a[Math.floor(n/100)]} Hundred${n%100?` ${words(n%100)}`:""}`;
    if (n < 100000) return `${words(Math.floor(n/1000))} Thousand${n%1000?` ${words(n%1000)}`:""}`;
    if (n < 10000000) return `${words(Math.floor(n/100000))} Lakh${n%100000?` ${words(n%100000)}`:""}`;
    return `${words(Math.floor(n/10000000))} Crore${n%10000000?` ${words(n%10000000)}`:""}`;
  };
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  return `${words(rupees)} Rupees${paise ? ` and ${words(paise)} Paise` : ""} Only`;
};

// Simple formatter to support a few common tokens in date/time format
// Supported tokens: YYYY, MM, DD, HH, mm, ss
const formatDateTime = (date: Date, fmt?: string): string => {
  if (!fmt) {
    return `${date.toLocaleDateString('en-IN')} ${date.toLocaleTimeString('en-IN')}`;
  }
  const two = (n: number) => n.toString().padStart(2, '0');
  const tokens: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    MM: two(date.getMonth() + 1),
    DD: two(date.getDate()),
    HH: two(date.getHours()),
    mm: two(date.getMinutes()),
    ss: two(date.getSeconds()),
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (t) => tokens[t]);
};

// Convert legacy BillOrderData into FoodBillData for the new template
function buildFoodBillData(order: BillOrderData): FoodBillData {
  const business = (order as any).business || { name: "Your Business" } as any;

  const joinDefined = (parts: (string | undefined)[]) => parts.filter(Boolean).join(", ");
  const address = joinDefined([
    business.addressLine1,
    business.addressLine2,
    joinDefined([business.city, business.pincode])
  ]);

  const items = (order.items || []).map(it => ({
    name: it.name,
    price: it.unitPrice,
    quantity: it.quantity,
    amount: it.totalPrice,
  }));

  const subtotal = order.subtotal || 0;
  const discount = order.discountAmount || 0;
  const serviceCharge = order.serviceChargeAmount || 0;
  const grandTotal = order.totalAmount || Math.max(0, subtotal - discount) + serviceCharge + (order.taxAmount || 0);

  const gstBreakdown = Array.isArray(order.tax?.lines)
    ? order.tax!.lines!.map(l => ({ rate: 0, base: 0, tax: l.amount }))
    : [];

  return {
    restaurantName: business.name,
    address,
    phone: business.phone || "",
    email: business.email || "",
    website: business.website || "",
    fssai: business.fssai || "",
    gstin: business.gstin || "",
    orderType: order.orderType,
    customerName: order.customerName || "Walk-in Customer",
    customerPhone: order.customerPhone || "",
    tableNumber: order.tableNumber,
    waiterName: undefined,
    orderNumber: order.orderNumber || order.id,
    kotNumbers: (order as any).kotNumber ? [String((order as any).kotNumber)] : [],
    items,
    subtotal,
    discount,
    discountMode: "amount",
    serviceCharge,
    serviceChargeRate: 0,
    grandTotal,
    gstBreakdown,
    totalPayable: grandTotal,
    totalItems: items.reduce((s, it) => s + it.quantity, 0),
  };
}

export function generateBillHTML(order: BillOrderData, opts: GenerateBillOptions = {}): string {
  // Bridge old signature to the new legally-compliant food bill template.
  // For now we assume the order contains only food items (non-alcohol). If liquor items need a
  // separate template we will extend this later.
  //
  // NOTE: We purposely keep the function name the same so existing imports don’t break while we
  // progressively migrate call-sites to the dedicated helpers in food-bill.ts / liquor-bill.ts.

  // ---- 1. Build FoodBillData -----------------------------
  const data = buildFoodBillData(order);
  return generateFoodBillHTML(data);
}

// Utility to convert the older BillOrderData structure → FoodBillData expected by the new template
import { generateFoodBillHTML, FoodBillData } from "./food-bill";
import { generateLiquorBillHTML, LiquorBillData } from "./liquor-bill";
import { generateFoodBillFromOrder } from "./food-bill";
import { generateLiquorBillFromOrder } from "./liquor-bill";
import { calculateLegalBilling, BillingConfig } from "../utils/legal-billing";

// Helper function to get business details from billing settings
async function getBusinessDetails(): Promise<{
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  fssai: string;
  gstin: string;
}> {
  try {
    const response = await fetch('/api/billing-settings?key=business_details');
    if (response.ok) {
      const settings = await response.json();
      if (Array.isArray(settings) && settings.length > 0) {
        return JSON.parse(settings[0].value);
      }
    }
  } catch (error) {
    console.warn('Failed to fetch business details from settings:', error);
  }
  
  // Return default values if not found
  return {
    restaurantName: "BORDERS RESTO & PUB",
    address: "123, Example St., Delhi, 112234",
    phone: "9012345678",
    email: "hello@borderspub.com",
    website: "www.borderspub.in",
    fssai: "11223344556677",
    gstin: "27ABCDE1234F1Z5",
  };
}

/** Detect liquor items in the plain order object (as returned from DB) */
function splitOrderItems(order: any) {
  const items: any[] = Array.isArray(order.orderItems) ? order.orderItems : [];
  const food: any[] = [];
  const liquor: any[] = [];
  for (const it of items) {
    const isAlcohol = Boolean(
      (it as any)?.product?.isAlcohol ??
      (it as any)?.products?.isAlcohol ??
      (it as any)?.isAlcohol
    );
    (isAlcohol ? liquor : food).push(it);
  }
  return { food, liquor };
}

function toCartItems(items: any[]) {
  return items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const unit = Number(it.unitPrice) || 0;
    const persistedTotal = Number(it.totalPrice);
    const safeTotal = !isNaN(persistedTotal) && persistedTotal > 0 ? persistedTotal : (qty * unit);
    const inferredUnit = qty > 0 ? safeTotal / qty : unit;
    return {
      key: String(it.id ?? `${it.productId}-${it.quantity}-${it.unitPrice}`),
      productId: it.productId,
      productName: it.productName,
      quantity: qty,
      basePrice: inferredUnit,
      totalPrice: safeTotal,
      addons: [],
      variant: undefined,
      customizationNotes: it.customizationNotes || "",
    };
  });
}

function toProductsFromItems(items: any[]) {
  const map = new Map<string, { id: string; isAlcohol?: boolean }>();
  for (const it of items) {
    const id = String(it.productId);
    if (!map.has(id)) {
      const isAlcohol = Boolean(
        (it as any)?.product?.isAlcohol ??
        (it as any)?.products?.isAlcohol ??
        (it as any)?.isAlcohol
      );
      map.set(id, { id, isAlcohol });
    }
  }
  return Array.from(map.values());
}

function buildLiquorBillData(order: any, liquorItems: any[]): LiquorBillData {
  const business = order.business || { name: "Your Business" } as any;
  const joinDefined = (parts: (string | undefined)[]) => parts.filter(Boolean).join(", ");
  const address = joinDefined([
    business.addressLine1,
    business.addressLine2,
    joinDefined([business.city, business.pincode])
  ]);

  const subtotal = liquorItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
  const discount = 0; // unknown here
  const serviceCharge = 0;
  const vatRate = order.vatRate ?? 18; // default 18 when not provided
  const vatTax = subtotal * (vatRate / 100);
  const grandTotal = subtotal + vatTax + serviceCharge - discount;

  return {
    restaurantName: business.name,
    address,
    phone: business.phone || "",
    email: business.email || "",
    website: business.website || "",
    fssai: business.fssai || "",
    gstin: business.gstin || "",
    orderType: order.orderType,
    customerName: order.customerName || "Walk-in Customer",
    customerPhone: order.customerPhone || "",
    tableNumber: order.tableNumber,
    waiterName: undefined,
    orderNumber: order.orderNumber || order.id,
    kotNumbers: order.kotNumber ? [String(order.kotNumber)] : [],
    items: liquorItems.map(it => ({
      name: it.productName,
      price: it.unitPrice,
      quantity: it.quantity,
      amount: it.totalPrice,
    })),
    subtotal,
    discount,
    discountMode: "amount",
    serviceCharge,
    serviceChargeRate: 0,
    grandTotal,
    vatBreakdown: [{ rate: vatRate, base: subtotal, tax: vatTax }],
    totalPayable: grandTotal,
    totalItems: liquorItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0),
  };
}

// ------------------- SPLIT PRINT ----------------------

type PrintAdjustments = {
  discountMode?: "percent" | "amount";
  discountInput?: string; // e.g., "5" or "125.50"
  isDiscountEnabled?: boolean;
  serviceChargeEnabled?: boolean;
  serviceChargeRate?: number; // percent
  businessModel?: 'COUNTER_SERVICE' | 'FINE_DINE' | 'NO_TAX';
};

export async function printSplitBill(
  order: any,
  isPaid: boolean,
  businessDetails: {
    restaurantName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    fssai: string;
    gstin: string;
  },
  paymentDetails?: { method: string; cashReceived?: number; changeDue?: number } & PrintAdjustments
) {
  try {
    // Re-fetch latest order with items from Supabase to ensure authoritative values
    let persisted: any | null = null;
    try {
      if (order?.id) {
        const response = await fetch(`/api/orders/${order.id}/print-data`);
        if (response.ok) {
          persisted = await response.json();
          console.log('Print: Successfully fetched persisted order:', persisted?.id);
        } else {
          console.warn('Print: Failed to fetch order data, status:', response.status);
        }
      }
    } catch (e) {
      console.warn('Print: failed to fetch persisted order, falling back to provided object', e);
    }

    const sourceOrder: any = persisted || order;
    const items: any[] = Array.isArray((sourceOrder as any).order_items)
      ? (sourceOrder as any).order_items
      : Array.isArray((sourceOrder as any).orderItems)
      ? (sourceOrder as any).orderItems
      : [];
    const { food, liquor } = splitOrderItems(order);

    // Build data for legal billing calculation (ensures correct group totals)
    const cartItems = toCartItems(items);
    const products = toProductsFromItems(items) as any[];

    const subtotalAll = items.reduce((s, it) => {
      const qty = Number(it.quantity) || 0;
      const unit = Number(it.unitPrice) || 0;
      const persistedTotal = Number(it.totalPrice);
      const safeTotal = !isNaN(persistedTotal) && persistedTotal > 0 ? persistedTotal : (qty * unit);
      return s + safeTotal;
    }, 0);
    const discountAmount = Number((sourceOrder as any).discountAmount || 0);
    const serviceChargeAmount = Number((sourceOrder as any).serviceChargeAmount || 0);
    const inferredServiceChargeRate = subtotalAll > 0 ? (serviceChargeAmount / Math.max(1, subtotalAll - discountAmount)) * 100 : 0;

    // Prefer explicit adjustments from caller (e.g., PaymentDrawer) if provided
    const useDiscountMode = paymentDetails?.discountMode ?? "amount";
    const useDiscountInput = paymentDetails?.isDiscountEnabled
      ? (paymentDetails?.discountInput || "")
      : (discountAmount > 0 ? String(discountAmount) : "");
    const useDiscountEnabled = paymentDetails?.isDiscountEnabled ?? (discountAmount > 0);

    const useServiceChargeEnabled = paymentDetails?.serviceChargeEnabled ?? (inferredServiceChargeRate > 0);
    const useServiceChargeRate = paymentDetails?.serviceChargeEnabled
      ? (paymentDetails?.serviceChargeRate || 0)
      : (inferredServiceChargeRate > 0 ? inferredServiceChargeRate : 0);

    const billingConfig: BillingConfig = {
      defaultTaxRate: 5,
      defaultAlcoholTaxRate: 18,
      defaultServiceChargeRate: 5,
      serviceChargeEnabled: useServiceChargeEnabled,
      serviceChargeRate: useServiceChargeRate,
    } as any;

    const legalBilling = calculateLegalBilling(
      cartItems,
      (products as any),
      useDiscountInput,
      useDiscountMode,
      useDiscountEnabled,
      billingConfig
    );

    const prints: string[] = [];

    if (food.length > 0) {
      // Build a food-only legalBilling view by zeroing out alcohol parts
      const foodOnly = {
        ...legalBilling,
        alcoholItems: [],
        alcoholSubtotal: 0,
        alcoholDiscount: 0,
        alcoholServiceCharge: 0,
        alcoholGrandBeforeTax: 0,
        alcoholVAT: 0,
        alcoholTotal: 0,
        totalPayable: legalBilling.foodTotal,
      } as typeof legalBilling;
      // Calculate rounded total for cash payments
      const roundedTotal = paymentDetails?.method === 'cash' ? Math.round(legalBilling.foodTotal) : undefined;
      const foodHtml = generateFoodBillFromOrder(order, foodOnly, businessDetails, roundedTotal, paymentDetails?.businessModel);
      console.log("PRINT DEBUG - Food Bill HTML:\n", foodHtml);
      prints.push(foodHtml);
    }
    if (liquor.length > 0) {
      // Build a liquor-only legalBilling view by zeroing out food parts
      const liquorOnly = {
        ...legalBilling,
        foodItems: [],
        foodSubtotal: 0,
        foodDiscount: 0,
        foodServiceCharge: 0,
        foodGrandBeforeTax: 0,
        foodSGST: 0,
        foodCGST: 0,
        foodTotal: 0,
        totalPayable: legalBilling.alcoholTotal,
      } as typeof legalBilling;
      // Calculate rounded total for cash payments
      const liquorRoundedTotal = paymentDetails?.method === 'cash' ? Math.round(legalBilling.alcoholTotal) : undefined;
      const liquorHtml = generateLiquorBillFromOrder(order, liquorOnly, businessDetails, liquorRoundedTotal, paymentDetails?.businessModel);
      console.log("PRINT DEBUG - Liquor Bill HTML:\n", liquorHtml);
      prints.push(liquorHtml);
    }

    // If debug flag set, skip printing to window and only log HTML
    const debugFlag = (() => {
      try { return typeof window !== 'undefined' && localStorage.getItem('debug.print') === 'true'; } catch { return false; }
    })();

    if (debugFlag) return;

    for (const html of prints) {
      const w = window.open('', '_blank');
      if (!w) throw new Error('Unable to open print window');
      w.document.write(html);
      w.document.close();
      await new Promise(res => {
        w.onload = () => {
          w.print();
          w.close();
          res(null);
        };
        setTimeout(() => {
          if (!w.closed) {
            w.print();
            w.close();
          }
          res(null);
        }, 800);
      });
    }
  } catch (err) {
    console.error('Split bill print failed', err);
  }
}

// Modify existing printBillFromOrder to delegate
export async function printBillFromOrder(
  order: any, 
  isPaid: boolean, 
  businessDetails: {
    restaurantName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    fssai: string;
    gstin: string;
  },
  paymentDetails?: { method: string; cashReceived?: number; changeDue?: number }
): Promise<void> {
  // Use new split logic
  return printSplitBill(order, isPaid, businessDetails, paymentDetails);
}

// Convenience function that automatically fetches business details
export async function printBillFromOrderAuto(
  order: any, 
  isPaid: boolean, 
  paymentDetails?: { method: string; cashReceived?: number; changeDue?: number }
): Promise<void> {
  const businessDetails = await getBusinessDetails();
  return printBillFromOrder(order, isPaid, businessDetails, paymentDetails);
}


