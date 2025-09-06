import { Order } from "@/types/orders";
import { LegalBillingResult } from "@/lib/utils/legal-billing";

export interface LiquorBillData {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  fssai: string;
  gstin: string;
  orderType: string;
  customerName: string;
  customerPhone: string;
  tableNumber?: string;
  waiterName?: string;
  orderNumber: string;
  kotNumbers: string[];
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    amount: number;
    variant?: { name: string; price: number };
    addons?: Array<{ name: string; price: number }>;
    notes?: string;
  }>;
  subtotal: number;
  discount: number;
  discountMode: "percent" | "amount";
  serviceCharge: number;
  serviceChargeRate: number;
  grandTotal: number;
  vatBreakdown: Array<{ rate: number; base: number; tax: number }>;
  totalPayable: number;
  totalItems: number;
  roundedTotal?: number; // For cash payments
  businessModel?: 'COUNTER_SERVICE' | 'FINE_DINE'; // Business model for tax display logic
}

export function generateLiquorBillHTML(data: LiquorBillData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${rate}%`;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Liquor Bill</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      width: 80mm;
      margin: 0 auto;
      padding: 0;
      line-height: 1.4
    }
    
    .separator {
      border-top: 1px solid #000;
      margin: 5px 0
    }
    
    .header {
      text-align: left;
      margin-bottom: 5px
    }
    
    .header strong {
      font-size: 16px
    }
    
    .row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0
    }
    
    .row.bold {
      font-weight: 700
    }
    
    .row .label {
      flex: 2
    }
    
    .row .amt,
    .row .price,
    .row .qty {
      flex: 1;
      text-align: right
    }
    
    .section-title {
      text-align: center;
      font-weight: 700;
      margin: 5px 0
    }
    
    .total {
      font-weight: 700
    }
    
    .center {
      display: block;
      text-align: center;
      margin-top: 5px;
      font-size: 11px
    }
    
    .policy {
      font-size: 9px;
      color: gray;
      display: block;
      margin-top: 5px;
      line-height: 1.2;
      text-align: left
    }
    
    .headersmall {
      font-size: 10px;
      color: gray;
      display: block;
      margin-top: 2px;
      line-height: 1.2;
      text-align: left
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 5px
    }
    
    .header-left {
      flex: 3;
      text-align: left
    }
    
    .header-right {
      flex: 1;
      text-align: right
    }
    
    .header-right img {
      max-width: 80px;
      height: auto
    }
    
    .powered {
      font-size: 9px;
      margin-top: 3px
    }
    </style>
  </head>
  <body>
     <div class="header">
    <div class="header-left">
      <strong>${data.restaurantName}</strong><br>
      <span class="headersmall">${data.address}<br>${data.phone} • ${data.email}<br>${data.website}<br>FSSAI: ${data.fssai}<br>GSTIN: ${data.gstin}</span>
      <div class="powered">This Store is Powered by Horders POS</div>
    </div>
    <div class="header-right">
      <img src="https://img.freepik.com/free-vector/gradient-restaurant-logo-design_23-2151257068.jpg" alt="Logo">
    </div>
  </div>
    
    <div class="separator"></div>
    
    <div class="row">
      <div class="label">${data.orderType}</div>
      <div class="price">${data.customerName}</div>
      <div class="amt">${data.customerPhone}</div>
    </div>
    
    <div class="row">
      <div class="label">${data.tableNumber ? `Table ${data.tableNumber}` : ''} ${data.waiterName ? `Served By ${data.waiterName}` : ''} <br>#${data.orderNumber} </div>
      <div class="amt">KOT #${data.kotNumbers.join(',#')}</div>
    </div>
    
    <div class="separator"></div>
    <div class="section-title">Liquor Bill</div>
    <div class="separator"></div>
    
    <div class="row bold">
      <div class="label">Item</div>
      <div class="price">Price</div>
      <div class="qty">Qty</div>
      <div class="amt">Amt</div>
    </div>
    
    <div class="separator"></div>
    
    ${data.items.map(item => `
    <div class="row">
      <div class="label">${item.name.toUpperCase()}</div>
      <div class="price">${formatCurrency(item.price)}</div>
      <div class="qty">${item.quantity.toFixed(2)}</div>
      <div class="amt">${formatCurrency(item.amount)}</div>
    </div>
    ${item.variant ? `<div class="row" style="font-style: italic; color: #555;">
      <div class="label">Variant: ${item.variant.name}</div>
      <div class="price"></div>
      <div class="qty"></div>
      <div class="amt">${formatCurrency(item.variant.price)}</div>
    </div>` : ''}
    ${(item.addons || []).map(ad => `<div class="row" style="font-style: italic; color: #555;">
      <div class="label">Add-on: ${ad.name}</div>
      <div class="price"></div>
      <div class="qty"></div>
      <div class="amt">${formatCurrency(ad.price)}</div>
    </div>`).join('')}
    ${item.notes ? `<div class="row" style="font-style: italic; color: #555; font-size: 10px;">
      <div class="label">${item.notes}</div>
    </div>` : ''}
    `).join('')}
    
    <div class="separator"></div>
    
    <div class="row">
      <div class="label">Subtotal</div>
      <div class="amt">${formatCurrency(data.subtotal)}</div>
    </div>
    
    <div class="row">
      <div class="label">Discount</div>
      <div class="price">${data.discountMode === 'percent' ? formatPercentage(data.discount) : formatCurrency(data.discount)}</div>
      <div class="amt">-${formatCurrency(data.discount)}</div>
    </div>
    
    <div class="row">
      <div class="label">Service Charge</div>
      <div class="price">${formatPercentage(data.serviceChargeRate)}</div>
      <div class="amt">${formatCurrency(data.serviceCharge)}</div>
    </div>
    
    <div class="separator"></div>
    
    <div class="row bold total">
      <div class="label">Grand Total</div>
      <div class="amt">${formatCurrency(data.grandTotal)}</div>
    </div>
    
    <div class="separator"></div>
    
    ${data.vatBreakdown.map(vat => `
    <div class="row">
      <div class="label">VAT</div>
      <div class="price">${formatPercentage(vat.rate)}</div>
      <div class="amt">${formatCurrency(vat.tax)}</div>
    </div>
    `).join('')}
    
    <div class="separator"></div>
    
    <div class="row bold total">
      <div class="label">Total Payable</div>
      <div class="amt">${formatCurrency(data.totalPayable)}</div>
    </div>
    
    <div class="separator"></div>
    
    <div class="row">
      <div class="label">Total No. Items - Liquor</div>
      <div class="amt">${data.totalItems.toFixed(2)}</div>
    </div>
    
    ${data.roundedTotal && data.roundedTotal !== data.totalPayable ? `
    <div class="row">
      <div class="label">Rounded Total</div>
      <div class="amt">${formatCurrency(data.roundedTotal)}</div>
    </div>
    ` : ''}
    
    <div class="separator">
      <br>
    </div>
    
    <div class="footer">
    <span class="center">Thank you for coming.<br>We wish to see you again at ${data.restaurantName.split(' ')[0]}!</span>
    <div class="policy">
      • All prices are inclusive of applicable taxes unless stated otherwise.<br>
      • Service charge, if any, is discretionary.<br>
      • Liquor is served only to guests above 25 years of age (as per law).<br>
      • No outside food or beverages allowed.<br>
      • Management reserves the right of admission.<br>
      • Please drink responsibly.
    </div>
  </body>
</html>`;
}

export function generateLiquorBillFromOrder(
  order: Order, 
  legalBilling: LegalBillingResult,
  businessDetails: {
    restaurantName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    fssai: string;
    gstin: string;
  },
  roundedTotal?: number,
  businessModel?: 'COUNTER_SERVICE' | 'FINE_DINE'
): string {
  const items = (legalBilling.alcoholItems || []).map(item => {
    const quantity = item.quantity || 0;
    const unitPrice = quantity > 0 ? item.totalPrice / quantity : item.totalPrice; // includes addons / variants

    // unitPrice already includes addons/variant amounts

    return {
      name: item.productName,
      price: unitPrice,
      quantity,
      amount: (item as any).discountedPrice || item.totalPrice,
      variant: item.variant ? { name: item.variant.name, price: item.variant.price } : undefined,
      addons: (item.addons || []).map((a: any) => ({ name: a.name, price: a.price })),
      notes: item.customizationNotes || (item as any).customizationNotes,
    };
  });

  const subtotal = Number(legalBilling.alcoholSubtotal || 0);
  const discount = Number((legalBilling as any).alcoholDiscount ?? (legalBilling as any).discountAmount ?? 0);
  const serviceCharge = Number((legalBilling as any).alcoholServiceCharge ?? (legalBilling as any).serviceChargeAmount ?? 0);
  const grandBeforeTax = Number((legalBilling as any).alcoholGrandBeforeTax ?? (subtotal - discount + serviceCharge));
  const vatAmount = Number((legalBilling as any).alcoholVAT || 0);
  const vatRate = grandBeforeTax > 0 ? (vatAmount / grandBeforeTax) * 100 : 18;
  const totalPayable = Number((legalBilling as any).alcoholTotal ?? (grandBeforeTax + vatAmount));
  const serviceChargeRate = (subtotal - discount) > 0 ? (serviceCharge / (subtotal - discount)) * 100 : 0;

  const vatBreakdown = [
    { rate: Number(vatRate.toFixed(2)), base: grandBeforeTax, tax: vatAmount }
  ];

  const billData: LiquorBillData = {
    restaurantName: businessDetails.restaurantName,
    address: businessDetails.address,
    phone: businessDetails.phone,
    email: businessDetails.email,
    website: businessDetails.website,
    fssai: businessDetails.fssai,
    gstin: businessDetails.gstin,
    orderType: order.orderType || "Dine In",
    customerName: order.customerName || "Walk-in Customer",
    customerPhone: order.customerPhone || "",
    tableNumber: order.tableNumber,
    waiterName: "Waiter Name", // TODO: Get from order
    orderNumber: order.orderNumber || order.id,
    kotNumbers: [order.kotNumber?.toString() || "N/A"],
    items,
    subtotal,
    discount,
    discountMode: (legalBilling as any).alcoholDiscountMode ?? (legalBilling as any).discountMode ?? "amount",
    serviceCharge,
    serviceChargeRate: Number(serviceChargeRate.toFixed(2)),
    grandTotal: grandBeforeTax,
    vatBreakdown,
    totalPayable,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    roundedTotal,
    businessModel
  };

  return generateLiquorBillHTML(billData);
}
