"use client";

import React, { useEffect, useState } from "react";

interface PaymentsState {
  cash: boolean;
  card: boolean;
  upi: boolean;
  paypal: boolean;
  splitPayments: boolean;
  tipsEnabled: boolean;
  defaultTipPerc: number;
  refundRules: string;
  cashRounding: 'none' | 'nearest-0.05' | 'nearest-0.10';
  stripeEnabled: boolean;
  razorpayEnabled: boolean;
  squareEnabled: boolean;
}

const STORAGE_KEY = 'settings.payments';

export default function PaymentsSettings() {
  const [state, setState] = useState<PaymentsState>({
    cash: true,
    card: true,
    upi: true,
    paypal: false,
    splitPayments: true,
    tipsEnabled: true,
    defaultTipPerc: 10,
    refundRules: '',
    cashRounding: 'none',
    stripeEnabled: false,
    razorpayEnabled: false,
    squareEnabled: false,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg(null);
    try {
      await fetch('/api/settings/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      setSavedMsg('Saved successfully');
    } catch (_) {
      setSavedMsg('Saved locally (backend unavailable)');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 2000);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Payment Methods</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['cash', 'Cash'],
              ['card', 'Card'],
              ['upi', 'UPI'],
              ['paypal', 'PayPal'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={(state as any)[key]}
                  onChange={(e) => setState({ ...state, [key]: e.target.checked } as any)}
                />
                <span className="text-sm text-gray-800">{label}</span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-sm text-gray-800">Split payments</span>
              <input type="checkbox" checked={state.splitPayments} onChange={(e) => setState({ ...state, splitPayments: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-sm text-gray-800">Enable tips/gratuity</span>
              <input type="checkbox" checked={state.tipsEnabled} onChange={(e) => setState({ ...state, tipsEnabled: e.target.checked })} />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default tip (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={state.defaultTipPerc}
                onChange={(e) => setState({ ...state, defaultTipPerc: Math.max(0, Math.min(100, parseInt(e.target.value || '0'))) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash rounding</label>
              <select
                value={state.cashRounding}
                onChange={(e) => setState({ ...state, cashRounding: e.target.value as PaymentsState['cashRounding'] })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="none">None</option>
                <option value="nearest-0.05">Nearest 0.05</option>
                <option value="nearest-0.10">Nearest 0.10</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Refund rules</label>
            <textarea
              value={state.refundRules}
              onChange={(e) => setState({ ...state, refundRules: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Describe refund eligibility, time limits, receipts required, etc."
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Online Gateways</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['stripeEnabled', 'Stripe'],
              ['razorpayEnabled', 'Razorpay'],
              ['squareEnabled', 'Square'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-800">{label}</span>
                <input
                  type="checkbox"
                  checked={(state as any)[key]}
                  onChange={(e) => setState({ ...state, [key]: e.target.checked } as any)}
                />
              </label>
            ))}
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Reports</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button className="px-4 py-2 rounded-md bg-white text-gray-800 border border-gray-300 text-sm hover:bg-gray-50">Settlement Report</button>
              <button className="px-4 py-2 rounded-md bg-white text-gray-800 border border-gray-300 text-sm hover:bg-gray-50">Closing Balance</button>
              <button className="px-4 py-2 rounded-md bg-white text-gray-800 border border-gray-300 text-sm hover:bg-gray-50">Refunds</button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
        {savedMsg && <span className="text-sm text-gray-600">{savedMsg}</span>}
      </div>
    </div>
  );
}


