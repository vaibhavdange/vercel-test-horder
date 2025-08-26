"use client";

import React, { useEffect, useMemo, useState } from "react";
import { generateBillHTML, type BillBusinessInfo } from "@/lib/print/bill";
import { useBillingSettings, useCreateBillingSetting, useUpdateBillingSetting } from "@/hooks/use-billing-settings";

type PrinterType = 'receipt' | 'kot' | 'invoice';

interface PrinterProfile {
  id: string;
  name: string;
  type: PrinterType;
  group?: string; // kitchen, bar, bakery
  paper: '58mm' | '80mm' | 'A4';
  autoPrint: boolean;
}

const STORAGE_KEY = 'settings.printers';
const BILL_SETTINGS_KEY = 'settings.print.bill';

export default function PrintSettings() {
  const [profiles, setProfiles] = useState<PrinterProfile[]>([]);
  const [billSettings, setBillSettings] = useState<any>(() => {
    try {
      const raw = localStorage.getItem(BILL_SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      paper: '58',
      business: { name: 'Your Store' } as BillBusinessInfo,
      tax: { showSplitGST: true, gstRatePercent: 5 },
      extras: { showPaymentDetails: true },
      footer: { thankYouText: 'Thank you for your order!' },
    };
  });
  const [draft, setDraft] = useState<PrinterProfile>({
    id: '',
    name: '',
    type: 'receipt',
    group: '',
    paper: '80mm',
    autoPrint: false,
  });

  useEffect(() => {
    // Hydrate from backend first, then fallback to localStorage
    const hydrate = async () => {
      try {
        const res = await fetch('/api/settings/printers');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.profiles)) setProfiles(data.profiles);
          if (data?.bill && typeof data.bill === 'object') {
            setBillSettings((prev: any) => ({ ...prev, ...data.bill }));
            try { localStorage.setItem(BILL_SETTINGS_KEY, JSON.stringify({ ...billSettings, ...data.bill })); } catch {}
          }
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data.profiles || [])); } catch {}
          return;
        }
      } catch {}
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setProfiles(JSON.parse(raw));
      } catch {}
    };
    hydrate();
  }, []);

  useEffect(() => {
    try { localStorage.setItem(BILL_SETTINGS_KEY, JSON.stringify(billSettings)); } catch {}
  }, [billSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {}
  }, [profiles]);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Order Button Action (reuse billing settings store/APIs)
  const { data: billingSettings = [] } = useBillingSettings();
  const createBillingSetting = useCreateBillingSetting();
  const updateBillingSetting = useUpdateBillingSetting();
  const [orderButtonAction, setOrderButtonAction] = useState<string>("create_order");
  const [savingOrderAction, setSavingOrderAction] = useState<boolean>(false);

  useEffect(() => {
    const orderButtonSetting = billingSettings.find((s: any) => s.key === "order_button_action");
    if (orderButtonSetting?.value) {
      setOrderButtonAction(orderButtonSetting.value);
    }
  }, [billingSettings]);

  const orderButtonOptions = [
    { value: "create_order", label: "Create Order", description: "Creates a new order and sends it to the orders page" },
    { value: "create_order_print_kot", label: "Create Order & Print KOT", description: "Creates order, sends to orders page, and prints KOT" },
    { value: "create_order_print_bill", label: "Create Order & Print Bill (Unpaid)", description: "Creates order and prints Bill with unpaid status" },
    { value: "create_order_pay", label: "Create Order & Pay", description: "Opens payment drawer and prints Bill after payment" },
  ];

  const saveOrderButtonAction = async () => {
    setSavingOrderAction(true);
    try {
      const existing = billingSettings.find((s: any) => s.key === "order_button_action");
      if (existing) {
        await updateBillingSetting.mutateAsync({ id: existing.id, data: { value: orderButtonAction, description: "Action performed by the Create Order button in new order page" } });
      } else {
        await createBillingSetting.mutateAsync({ key: "order_button_action", value: orderButtonAction, description: "Action performed by the Create Order button in new order page" });
      }
      setSavedMsg("Order button action saved");
    } catch (_) {
      setSavedMsg("Saved locally (backend unavailable)");
    } finally {
      setSavingOrderAction(false);
      setTimeout(() => setSavedMsg(null), 2000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg(null);
    try {
      await fetch('/api/settings/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles, bill: billSettings }),
      });
      setSavedMsg('Saved successfully');
    } catch (_) {
      setSavedMsg('Saved locally (backend unavailable)');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 2000);
    }
  };

  const addProfile = () => {
    if (!draft.name.trim()) return;
    const profile = { ...draft, id: Date.now().toString() };
    setProfiles((prev) => [profile, ...prev]);
    setDraft({ id: '', name: '', type: 'receipt', group: '', paper: '80mm', autoPrint: false });
  };

  const updateProfile = (id: string, updates: Partial<PrinterProfile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProfile = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const testPrint = (id: string) => {
    // Placeholder test print
    alert(`Test print sent to printer ${id}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">Printers</h3>
        <p className="text-sm text-gray-500">Configure receipts, KOT and invoice printers.</p>
      </div>

      {/* Order Button Action (moved here per request) */}
      <div className="rounded-lg border border-gray-200 p-4 mb-6">
        <div className="mb-2">
          <div className="text-sm font-medium text-gray-900">Order Button Action</div>
          <div className="text-xs text-gray-500">Control what happens after creating an order (includes KOT option).</div>
        </div>
        <div className="space-y-3 mt-3">
          {orderButtonOptions.map((opt) => (
            <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="orderButtonAction"
                value={opt.value}
                checked={orderButtonAction === opt.value}
                onChange={(e) => setOrderButtonAction(e.target.value)}
                className="mt-1 h-4 w-4 text-emerald-600 border-gray-300"
              />
              <div className="flex-1">
                <div className="text-sm text-gray-900">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.description}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <button onClick={saveOrderButtonAction} disabled={savingOrderAction} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50">
            {savingOrderAction ? 'Saving...' : 'Save Action'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile name</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Front Desk Receipt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as PrinterType })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="receipt">Receipt</option>
              <option value="kot">KOT</option>
              <option value="invoice">Invoice</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
            <input
              value={draft.group}
              onChange={(e) => setDraft({ ...draft, group: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Kitchen, Bar, Bakery"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paper size</label>
            <select
              value={draft.paper}
              onChange={(e) => setDraft({ ...draft, paper: e.target.value as PrinterProfile['paper'] })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="58mm">58mm</option>
              <option value="80mm">80mm</option>
              <option value="A4">A4</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={addProfile} className="w-full px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">Add Printer</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.length === 0 && (
          <div className="col-span-full text-center text-sm text-gray-500 py-10 border border-dashed border-gray-300 rounded-lg">No printers configured.</div>
        )}
        {profiles.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{p.name}</h4>
                <p className="text-xs text-gray-500">{p.type.toUpperCase()} • {p.paper}{p.group ? ` • ${p.group}` : ''}</p>
              </div>
              <button onClick={() => deleteProfile(p.id)} className="text-xs text-red-600 hover:underline">Delete</button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-800">Auto print</span>
              <input type="checkbox" checked={p.autoPrint} onChange={(e) => updateProfile(p.id, { autoPrint: e.target.checked })} />
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200 flex items-center justify-between">
              <button className="text-sm text-gray-700 hover:underline">Preview</button>
              <button onClick={() => testPrint(p.id)} className="text-sm text-emerald-700 hover:underline">Test Print</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
        {savedMsg && <span className="text-sm text-gray-600">{savedMsg}</span>}
      </div>

      {/* Bill settings */}
      <div className="mt-10">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Bill</h3>
        <p className="text-sm text-gray-500 mb-4">Control what appears on the customer bill and preview it live.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paper width</label>
                <select
                  value={billSettings.paper}
                  onChange={(e) => setBillSettings({ ...billSettings, paper: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="58">58mm</option>
                  <option value="80">80mm</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred date/time format</label>
                <input
                  value={billSettings.dateTimeFormat || ''}
                  onChange={(e) => setBillSettings({ ...billSettings, dateTimeFormat: e.target.value })}
                  placeholder="DD/MM/YYYY HH:mm (optional)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store name</label>
                <input value={billSettings.business?.name || ''} onChange={(e) => setBillSettings({ ...billSettings, business: { ...billSettings.business, name: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={billSettings.business?.phone || ''} onChange={(e) => setBillSettings({ ...billSettings, business: { ...billSettings.business, phone: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Address line 1" value={billSettings.business?.addressLine1 || ''} onChange={(e) => setBillSettings({ ...billSettings, business: { ...billSettings.business, addressLine1: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input placeholder="Address line 2" value={billSettings.business?.addressLine2 || ''} onChange={(e) => setBillSettings({ ...billSettings, business: { ...billSettings.business, addressLine2: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input placeholder="City" value={billSettings.business?.city || ''} onChange={(e) => setBillSettings({ ...billSettings, business: { ...billSettings.business, city: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input placeholder="Pincode" value={billSettings.business?.pincode || ''} onChange={(e) => setBillSettings({ ...billSettings, business: { ...billSettings.business, pincode: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input placeholder="Email" value={billSettings.business?.email || ''} onChange={(e) => setBillSettings({ ...billSettings, business: { ...billSettings.business, email: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input placeholder="Website" value={billSettings.business?.website || ''} onChange={(e) => setBillSettings({ ...billSettings, business: { ...billSettings.business, website: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="GSTIN" value={billSettings.business?.gstin || ''} onChange={(e) => setBillSettings({ ...billSettings, business: { ...billSettings.business, gstin: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input placeholder="FSSAI" value={billSettings.business?.fssai || ''} onChange={(e) => setBillSettings({ ...billSettings, business: { ...billSettings.business, fssai: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-800">Split GST (CGST/SGST)</span>
                <input type="checkbox" checked={!!billSettings.tax?.showSplitGST} onChange={(e) => setBillSettings({ ...billSettings, tax: { ...(billSettings.tax||{}), showSplitGST: e.target.checked } })} />
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST rate (%)</label>
                <input type="number" min={0} step={0.1} value={billSettings.tax?.gstRatePercent ?? ''} onChange={(e) => setBillSettings({ ...billSettings, tax: { ...(billSettings.tax||{}), gstRatePercent: parseFloat(e.target.value) } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Footer Thank you text" value={billSettings.footer?.thankYouText || ''} onChange={(e) => setBillSettings({ ...billSettings, footer: { ...(billSettings.footer||{}), thankYouText: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input placeholder="Footer policy text" value={billSettings.footer?.policyText || ''} onChange={(e) => setBillSettings({ ...billSettings, footer: { ...(billSettings.footer||{}), policyText: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <textarea placeholder="Footer custom note" value={billSettings.footer?.customNote || ''} onChange={(e) => setBillSettings({ ...billSettings, footer: { ...(billSettings.footer||{}), customNote: e.target.value } })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Live Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto">
            <div className="text-xs text-gray-500 mb-2">Preview</div>
            <iframe
              title="bill-preview"
              srcDoc={generateBillHTML({
                id: 'preview',
                orderNumber: 'PREVIEW-001',
                orderType: 'dine-in',
                tableNumber: '5',
                customerName: 'Walk-in Customer',
                subtotal: 300,
                taxAmount: billSettings.tax?.gstRatePercent ? (300 * (billSettings.tax.gstRatePercent/100)) : 15,
                serviceChargeAmount: 0,
                discountAmount: 0,
                totalAmount: 315,
                isPaid: true,
                items: [
                  { name: 'Classic Cheeseburger', quantity: 1, unitPrice: 300, totalPrice: 300 },
                ],
                business: billSettings.business,
                tax: { showSplitGST: !!billSettings.tax?.showSplitGST },
                footer: billSettings.footer,
              }, { paper: billSettings.paper, dateTimeFormat: billSettings.dateTimeFormat })}
              className="w-full h-[540px] bg-white border border-gray-200 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


