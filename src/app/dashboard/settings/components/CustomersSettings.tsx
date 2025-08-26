"use client";

import React, { useEffect, useState } from "react";

interface CustomersSettingsState {
  loyaltyProgram: boolean;
  pointsPerCurrency: number;
  cashbackEnabled: boolean;
  tiersEnabled: boolean;
  giftCardsEnabled: boolean;
  storeCreditsEnabled: boolean;
  marketingOptInDefault: boolean;
  blacklist: string[];
}

const STORAGE_KEY = 'settings.customers';

export default function CustomersSettings() {
  const [state, setState] = useState<CustomersSettingsState>({
    loyaltyProgram: true,
    pointsPerCurrency: 1,
    cashbackEnabled: false,
    tiersEnabled: false,
    giftCardsEnabled: true,
    storeCreditsEnabled: true,
    marketingOptInDefault: true,
    blacklist: [],
  });

  const [newBlacklist, setNewBlacklist] = useState('');

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
      await fetch('/api/settings/customers', {
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

  const addBlacklist = () => {
    const entry = newBlacklist.trim();
    if (!entry) return;
    setState((s) => ({ ...s, blacklist: [entry, ...s.blacklist] }));
    setNewBlacklist('');
  };

  const removeBlacklist = (entry: string) => {
    setState((s) => ({ ...s, blacklist: s.blacklist.filter((e) => e !== entry) }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Loyalty & Programs</h3>
          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <span className="text-sm text-gray-800">Enable loyalty program</span>
            <input type="checkbox" checked={state.loyaltyProgram} onChange={(e) => setState({ ...state, loyaltyProgram: e.target.checked })} />
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Points per currency unit</label>
            <input
              type="number"
              min={0}
              value={state.pointsPerCurrency}
              onChange={(e) => setState({ ...state, pointsPerCurrency: Math.max(0, parseFloat(e.target.value || '0')) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-sm text-gray-800">Cashback</span>
              <input type="checkbox" checked={state.cashbackEnabled} onChange={(e) => setState({ ...state, cashbackEnabled: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-sm text-gray-800">Tiers</span>
              <input type="checkbox" checked={state.tiersEnabled} onChange={(e) => setState({ ...state, tiersEnabled: e.target.checked })} />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-sm text-gray-800">Gift cards</span>
              <input type="checkbox" checked={state.giftCardsEnabled} onChange={(e) => setState({ ...state, giftCardsEnabled: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-sm text-gray-800">Store credits</span>
              <input type="checkbox" checked={state.storeCreditsEnabled} onChange={(e) => setState({ ...state, storeCreditsEnabled: e.target.checked })} />
            </label>
          </div>
          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <span className="text-sm text-gray-800">Marketing opt-in default</span>
            <input type="checkbox" checked={state.marketingOptInDefault} onChange={(e) => setState({ ...state, marketingOptInDefault: e.target.checked })} />
          </label>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Blacklist</h3>
          <div className="flex items-center gap-2">
            <input
              value={newBlacklist}
              onChange={(e) => setNewBlacklist(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter phone/email/ID"
            />
            <button onClick={addBlacklist} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700">Add</button>
          </div>
          <ul className="divide-y divide-gray-200">
            {state.blacklist.length === 0 && (
              <li className="py-6 text-sm text-gray-500 text-center">No blacklisted customers.</li>
            )}
            {state.blacklist.map((entry) => (
              <li key={entry} className="py-3 flex items-center justify-between">
                <span className="text-sm text-gray-800">{entry}</span>
                <button onClick={() => removeBlacklist(entry)} className="text-sm text-red-600 hover:underline">Remove</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
        {savedMsg && <span className="text-sm text-gray-600">{savedMsg}</span>}
      </div>
    </div>
  );
}


