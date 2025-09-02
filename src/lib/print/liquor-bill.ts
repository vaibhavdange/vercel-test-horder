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
    <title>Thermal Bill</title>
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
        font-size: 14px
      }

      .right {
        float: right
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
        text-align: left;
      }
    </style>
  </head>
  <body>
    <!-- Liquor Bill -->
    <div class="header">
      <strong>${data.restaurantName}</strong>
      <br>${data.address} <br>${data.phone} • ${data.email} <br>${data.website} <br>FSSAI <span class="right">${data.fssai}</span>
      <br>GSTIN <span class="right">${data.gstin}</span>
      <br>
      <span class="center">- This restaurant is Powered by Horders POS -</span>
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
    `).join('')}
    
    <div class="separator"></div>
    
    <div class="row">
      <div class="label">Subtotal</div>
      <div class="amt">${formatCurrency(data.subtotal)}</div>
    </div>
    
    <div class="row">
      <div class="label">Discount</div>
      <div class="price">${data.discountMode === 'percent' ? formatPercentage(data.discount) : formatCurrency(data.discount)}</div>
      <div class="amt">-</div>
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
    
    <div class="separator">
      <br>
    </div>
    
    <div class="footer">
      <span class="center">Thank you for coming. <br>We wish to see you again at ${data.restaurantName.split(' ')[0]}! </span>
      <div class="policy">
        <br>
        <span class="left">All prices are inclusive of applicable taxes unless stated otherwise. Service charge, if any, is discretionary. Liquor is served only to guests above 25 years of age (as per law). No outside food or beverages allowed. Management reserves the right of admission. Please drink responsibly.</span>
      </div>
    </div>
  </body>
</html>`;
}

export function generateLiquorBillFromOrder(order: Order, legalBilling: LegalBillingResult): string {
  const items = (legalBilling.alcoholItems || []).map(item => ({
    name: item.productName,
    price: item.basePrice,
    quantity: item.quantity,
    amount: (item as any).discountedPrice || item.totalPrice
  }));

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
    restaurantName: "BORDERS RESTO & PUB",        // constant or settings.bill.business.name
    address:      "123, Example St., Delhi, 112234",  
    phone:        "9012345678",
    email:        "hello@borderspub.com",
    website:      "www.borderspub.in",
    fssai:        "11223344556677",
    gstin:        "27ABCDE1234F1Z5",
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
    discountMode: "percent" | "amount",
    serviceCharge,
    serviceChargeRate: Number(serviceChargeRate.toFixed(2)),
    grandTotal: grandBeforeTax,
    vatBreakdown,
    totalPayable,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0)
  };

  return generateLiquorBillHTML(billData);
}
