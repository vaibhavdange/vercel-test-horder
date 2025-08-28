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

export function generateBillHTML(order: BillOrderData, opts: GenerateBillOptions = {}): string {
  const paper: PaperSize = opts.paper || '58';
  const widthPx = paper === '80' ? 560 : 384; // approximate printable width

  const business = order.business || { name: 'Your Business' };
  const service = order.serviceChargeAmount || 0;
  const discount = order.discountAmount || 0;
  const subtotal = order.subtotal || 0;
  const taxAmount = order.taxAmount || 0;
  // Calculate total following accounting standards: (subtotal - discount) + service + tax
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const total = order.totalAmount || (subtotalAfterDiscount + service + taxAmount);

  const showSplit = !!order.tax?.showSplitGST && (order.tax?.igstAmount || 0) === 0;
  const cgst = showSplit ? (order.tax?.cgstAmount ?? taxAmount / 2) : 0;
  const sgst = showSplit ? (order.tax?.sgstAmount ?? taxAmount / 2) : 0;
  const igst = (order.tax?.igstAmount || 0) > 0 ? (order.tax?.igstAmount || 0) : 0;

  const headerAddress = [business.addressLine1, business.addressLine2, [business.city, business.pincode].filter(Boolean).join(' ')].filter(Boolean).join('<br/>');
  const contact = [business.phone, business.email, business.website].filter(Boolean).join(' • ');

  const now = new Date();
  const dt = formatDateTime(now, opts.dateTimeFormat);

  const linesHTML = order.items.map((it) => `
      <div class="row">
        <div class="col name">${it.name}${it.hsn ? ` <span class="muted">(HSN ${it.hsn})</span>` : ''}</div>
        <div class="col qty">x${it.quantity}</div>
        <div class="col rate">${inrPlain(it.unitPrice)}</div>
        <div class="col amount">${inr(it.totalPrice)}</div>
      </div>
      ${it.notes ? `<div class="notes">${it.notes}</div>` : ''}
  `).join('');

  // Build tax lines: prefer explicit lines; fallback to split or single tax
  let gstHTML = '';
  if (Array.isArray(order.tax?.lines) && (order.tax?.lines || []).length > 0) {
    gstHTML = (order.tax?.lines || []).map(l => `<div class="row"><div class="col label">${l.name}</div><div class="col amount">${inr(l.amount || 0)}</div></div>`).join('\n');
  } else {
    gstHTML = igst > 0
      ? `<div class="row"><div class="col label">IGST</div><div class="col amount">${inr(igst)}</div></div>`
      : showSplit
        ? `<div class="row"><div class="col label">CGST</div><div class="col amount">${inr(cgst)}</div></div>
           <div class="row"><div class="col label">SGST</div><div class="col amount">${inr(sgst)}</div></div>`
        : `<div class="row"><div class="col label">Tax</div><div class="col amount">${inr(taxAmount)}</div></div>`;
  }

  const payHTML = order.extras?.showPaymentDetails ? `
    <div class="section">
      <div class="row"><div class="col label">Payment Method</div><div class="col amount">${order.extras?.paymentMethod || '-'}</div></div>
      ${order.extras?.paymentReference ? `<div class="row"><div class="col label">Reference</div><div class="col amount">${order.extras?.paymentReference}</div></div>` : ''}
      ${order.extras?.paymentMethod === 'cash' && typeof order.extras?.cashReceived === 'number' ? `<div class="row"><div class="col label">Cash Tendered</div><div class="col amount">${inr(order.extras.cashReceived || 0)}</div></div>` : ''}
      ${order.extras?.paymentMethod === 'cash' && typeof order.extras?.changeDue === 'number' ? `<div class="row"><div class="col label">Change Due</div><div class="col amount">${inr(order.extras.changeDue || 0)}</div></div>` : ''}
      ${order.extras?.paymentMethod !== 'cash' && typeof order.extras?.changeDue === 'number' ? `<div class="row"><div class="col label">Change Due</div><div class="col amount">${inr(order.extras.changeDue || 0)}</div></div>` : ''}
      ${typeof order.extras?.balanceDue === 'number' ? `<div class="row"><div class="col label">Balance</div><div class="col amount">${inr(order.extras.balanceDue || 0)}</div></div>` : ''}
    </div>
  ` : '';

  const brandingHTML = `
    ${business.logoDataUrl ? `<div class="logo"><img src="${business.logoDataUrl}" alt="logo"/></div>` : ''}
    <div class="title">${business.name}</div>
    ${headerAddress ? `<div class="muted center">${headerAddress}</div>` : ''}
    ${contact ? `<div class="muted center">${contact}</div>` : ''}
    ${business.gstin ? `<div class="muted center">GSTIN: ${business.gstin}</div>` : ''}
    ${business.fssai ? `<div class="muted center">FSSAI: ${business.fssai}</div>` : ''}
  `;

  const qrHTML = order.extras?.qrDataUrl ? `<div class="qr"><img src="${order.extras.qrDataUrl}"/></div>` : '';

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji','Segoe UI Emoji'; margin: 0; padding: 0; }
    .receipt { width: ${widthPx}px; margin: 0 auto; padding: 12px; }
    .center { text-align: center; }
    .title { font-weight: 700; font-size: 18px; text-align: center; }
    .muted { color: #6b7280; font-size: 14px; }
    .logo img { display: block; margin: 0 auto 6px; max-height: 56px; }
    .section { border-top: 1px dashed #e5e7eb; margin-top: 8px; padding-top: 8px; }
    .row { display: grid; grid-template-columns: 1fr auto auto auto; gap: 6px; align-items: baseline; font-size: 14px; }
    .row .name { grid-column: 1 / span 1; }
    .row .qty { width: 28px; text-align: right; }
    .row .rate { width: 60px; text-align: right; }
    .row .amount { width: 88px; text-align: right; font-variant-numeric: tabular-nums; }
    .row .label { grid-column: 1 / span 3; color: #374151; }
    .notes { margin: 2px 0 4px 0; color: #6b7280; font-size: 13px; padding-left: 8px; }
    .kv { display: flex; justify-content: space-between; font-size: 14px; }
    .total { font-weight: 700; font-size: 16px; }
    .badge { display:inline-block; padding:2px 6px; border-radius: 6px; font-weight:600; font-size:14px; }
    .paid { background:#d1fae5; color:#065f46; }
    .unpaid { background:#fee2e2; color:#991b1b; }
    .qr img { display:block; margin: 8px auto; width: 140px; height: 140px; }
    .footer { text-align:center; font-size:14px; color:#6b7280; margin-top: 8px; }
  </style>
  <title>Receipt</title>
  </head>
  <body>
    <div class="receipt">
      ${brandingHTML}

      <div class="section">
        <div class="kv"><span>Date/Time</span><span>${dt}</span></div>
        <div class="kv"><span>Order #</span><span>${order.orderNumber || order.id}</span></div>
        <div class="kv"><span>Order Type</span><span>${order.orderType}</span></div>
        ${order.tableNumber ? `<div class="kv"><span>Table</span><span>${order.tableNumber}</span></div>` : ''}
        ${order.customerName ? `<div class="kv"><span>Customer</span><span>${order.customerName}</span></div>` : ''}
        ${order.customerPhone ? `<div class="kv"><span>Phone</span><span>${order.customerPhone}</span></div>` : ''}
      </div>

      <div class="section">
        <div class="row" style="font-weight:600;">
          <div class="col name">Item</div>
          <div class="col qty">Qty</div>
          <div class="col rate">Rate</div>
          <div class="col amount">Amount</div>
        </div>
        ${linesHTML}
      </div>

      <div class="section">
        <div class="row"><div class="col label">Subtotal</div><div class="col amount">${inr(subtotal)}</div></div>
        ${discount > 0 ? `<div class="row"><div class="col label">Discount</div><div class="col amount">-${inr(discount)}</div></div>` : ''}
        ${service > 0 ? `<div class="row"><div class="col label">Service Charge</div><div class="col amount">${inr(service)}</div></div>` : ''}
        ${gstHTML}
        <div class="row total"><div class="col label">TOTAL</div><div class="col amount">${inr(total)}</div></div>
        <div class="center" style="margin-top:4px;">${order.isPaid ? `<span class="badge paid">PAID</span>` : `<span class="badge unpaid">UNPAID</span>`}</div>
      </div>

      ${payHTML}
      ${qrHTML}

      <div class="section">
        <div class="muted">Amount in words:</div>
        <div>${amountInWords(total)}</div>
      </div>

      <div class="footer">
        ${order.footer?.thankYouText || 'Thank you for your order!'}<br/>
        ${order.footer?.policyText ? `${order.footer.policyText}<br/>` : ''}
        ${order.footer?.customNote || ''}
      </div>
      <div class="footer">THIS STORE IS POWERED BY HORDER POS SYS</div>
    </div>
  </body>
</html>`;
}

// Client-side helper to print a bill consistently across pages
export async function printBillFromOrder(order: any, isPaid: boolean, paymentDetails?: { method: string; cashReceived?: number; changeDue?: number }): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      console.warn('printBillFromOrder called outside browser context');
      return;
    }



    // Fetch printers/bill settings from backend; fallback to localStorage
    let billSettings: any = {};
    try {
      const res = await fetch('/api/settings/printers');
      if (res.ok) {
        const data = await res.json();
        if (data?.bill && typeof data.bill === 'object') {
          billSettings = data.bill;
          try { localStorage.setItem('settings.print.bill', JSON.stringify(billSettings)); } catch {}
        }
      }
    } catch {}
    if (!billSettings || Object.keys(billSettings).length === 0) {
      try {
        const raw = localStorage.getItem('settings.print.bill');
        billSettings = raw ? JSON.parse(raw) : {};
      } catch {}
    }

    // Fetch billing settings for tax configuration
    let billingSettings: any = {};
    try {
      const res = await fetch('/api/billing-settings');
      if (res.ok) {
        const rows = await res.json();
        const map: Record<string, string> = {};
        for (const r of rows || []) map[r.key] = r.value;
        billingSettings = map;

      }
    } catch (error) {
      console.error('Failed to load billing settings:', error);
    }

    // Calculate amounts following accounting standards
    const subtotal = order.subtotal || 0;
    const discount = order.discountAmount || 0;
    const subtotalAfterDiscount = Math.max(0, subtotal - discount);
    
    // Calculate service charge if enabled
    const serviceChargeEnabled = billingSettings['service_charge_enabled'] === 'true';
    const serviceChargeRate = parseFloat(billingSettings['default_service_charge_rate'] || '0');
    const calculatedServiceCharge = serviceChargeEnabled ? (subtotalAfterDiscount * (serviceChargeRate / 100)) : 0;
    

    
    const taxLines = (() => {
      try {
        // Get tax types from billing settings
        const taxEnabled = billingSettings['tax_enabled'] === 'true';
        if (taxEnabled && billingSettings['tax_types']) {
          const parsed = JSON.parse(billingSettings['tax_types']);
          if (Array.isArray(parsed)) {
            return parsed.map((t: any) => ({ 
              name: String(t.name || ''), 
              amount: Math.round((subtotalAfterDiscount * ((Number(t.ratePercent)||0)/100)) * 100) / 100 
            }));
          }
        }
        // Fallback to bill settings
        const taxTypesRaw = (billSettings && billSettings.tax_types) ? billSettings.tax_types : (billSettings?.tax?.lines ? billSettings.tax.lines : null);
        const parsed = typeof taxTypesRaw === 'string' ? JSON.parse(taxTypesRaw) : taxTypesRaw;
        if (Array.isArray(parsed)) {
          return parsed.map((t: any) => ({ name: String(t.name || ''), amount: Math.round((subtotalAfterDiscount * ((Number(t.ratePercent)||0)/100)) * 100) / 100 }));
        }
      } catch (error) {
        console.error('Error calculating tax lines:', error);
      }
      return undefined;
    })();

    const html = generateBillHTML({
      id: order.id,
      orderNumber: order.orderNumber || order.id,
      orderType: order.orderType,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      serviceChargeAmount: calculatedServiceCharge || order.serviceChargeAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      isPaid,
      items: (order.orderItems || []).map((it: any) => ({
        name: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
        notes: it.customizationNotes
      })),
      business: billSettings.business,
      tax: { showSplitGST: !!billSettings?.tax?.showSplitGST, lines: taxLines },
      extras: { 
        showPaymentDetails: billSettings?.extras?.showPaymentDetails !== false,
        paymentMethod: paymentDetails?.method,
        cashReceived: paymentDetails?.cashReceived,
        changeDue: paymentDetails?.changeDue
      },
      footer: billSettings.footer,
    }, { paper: billSettings.paper === '80' ? '80' : '58', dateTimeFormat: billSettings.dateTimeFormat });

    if (window.electron?.printer?.print) {
      await window.electron.printer.print({ html, silent: true, paper: (billSettings.paper === '80' ? '80' : '58') });
      console.log('Bill printed successfully');
    } else {
      console.log('Bill content ready for printing:', html);
    }
  } catch (error) {
    console.error('Failed to print bill:', error);
  }
}


