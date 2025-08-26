"use client";

import React, { useEffect, useMemo, useState } from "react";

type RoundingRule = 'none' | 'round' | 'ceil' | 'floor';

interface TaxRate {
  id: string;
  name: string;
  rate: number; // e.g., 0.05 for 5%
  inclusive: boolean;
  location?: string;
  active: boolean;
  rounding: RoundingRule;
}

const STORAGE_KEY = 'settings.taxRates';

export default function TaxSettings() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [draft, setDraft] = useState<Partial<TaxRate>>({ inclusive: false, rate: 0.05, rounding: 'none', active: true });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTaxRates(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taxRates));
    } catch {}
  }, [taxRates]);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg(null);
    try {
      await fetch('/api/settings/tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxRates }),
      });
      setSavedMsg('Saved successfully');
    } catch (_) {
      setSavedMsg('Saved locally (backend unavailable)');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 2000);
    }
  };

  const canAdd = useMemo(() => {
    return Boolean(draft.name && draft.name.trim().length > 0 && typeof draft.rate === 'number');
  }, [draft.name, draft.rate]);

  const addRate = () => {
    if (!canAdd) return;
    const newRate: TaxRate = {
      id: Date.now().toString(),
      name: draft.name!.trim(),
      rate: Math.max(0, Number(draft.rate ?? 0)),
      inclusive: Boolean(draft.inclusive),
      location: draft.location?.trim() || undefined,
      active: draft.active ?? true,
      rounding: (draft.rounding as RoundingRule) ?? 'none',
    };
    setTaxRates((prev) => [newRate, ...prev]);
    setDraft({ inclusive: false, rate: 0.05, location: '', rounding: 'none', active: true, name: '' });
  };

  const updateRate = (id: string, updates: Partial<TaxRate>) => {
    setTaxRates((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteRate = (id: string) => {
    setTaxRates((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">Tax Rates</h3>
        <p className="text-sm text-gray-500">Manage VAT/GST/Sales tax profiles and rules.</p>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax name</label>
            <input
              type="text"
              value={draft.name ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., VAT, GST 5%"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.rate ?? 0}
              onChange={(e) => setDraft((d) => ({ ...d, rate: parseFloat(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inclusive</label>
            <div className="flex items-center h-[42px]">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, inclusive: !Boolean(d.inclusive) }))}
                className={`px-3 py-1.5 rounded-md text-sm border ${draft.inclusive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                {draft.inclusive ? 'Inclusive' : 'Exclusive'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={draft.location ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Dubai, UAE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rounding</label>
            <select
              value={draft.rounding ?? 'none'}
              onChange={(e) => setDraft((d) => ({ ...d, rounding: e.target.value as RoundingRule }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="none">None</option>
              <option value="round">Round</option>
              <option value="ceil">Ceil</option>
              <option value="floor">Floor</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={addRate}
              disabled={!canAdd}
              className={`w-full px-4 py-2 rounded-md text-sm font-medium ${canAdd ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              Add Tax
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Rate</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Inclusive</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Location</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Rounding</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Active</th>
              <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {taxRates.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">No tax rates added yet.</td>
              </tr>
            )}
            {taxRates.map((rate) => (
              <tr key={rate.id}>
                <td className="px-4 py-2 align-middle">
                  <input
                    value={rate.name}
                    onChange={(e) => updateRate(rate.id, { name: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2 align-middle">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(rate.rate * 100).toFixed(2)}
                      onChange={(e) => updateRate(rate.id, { rate: Math.max(0, parseFloat(e.target.value) / 100) })}
                      className="w-24 border border-gray-200 rounded-md px-2 py-1 text-sm"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </td>
                <td className="px-4 py-2 align-middle">
                  <button
                    type="button"
                    onClick={() => updateRate(rate.id, { inclusive: !rate.inclusive })}
                    className={`px-2 py-1 rounded-full text-xs border ${rate.inclusive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                  >
                    {rate.inclusive ? 'Inclusive' : 'Exclusive'}
                  </button>
                </td>
                <td className="px-4 py-2 align-middle">
                  <input
                    value={rate.location ?? ''}
                    onChange={(e) => updateRate(rate.id, { location: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm"
                    placeholder="Region/Location"
                  />
                </td>
                <td className="px-4 py-2 align-middle">
                  <select
                    value={rate.rounding}
                    onChange={(e) => updateRate(rate.id, { rounding: e.target.value as RoundingRule })}
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm"
                  >
                    <option value="none">None</option>
                    <option value="round">Round</option>
                    <option value="ceil">Ceil</option>
                    <option value="floor">Floor</option>
                  </select>
                </td>
                <td className="px-4 py-2 align-middle">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={rate.active}
                      onChange={(e) => updateRate(rate.id, { active: e.target.checked })}
                    />
                    <span>{rate.active ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </td>
                <td className="px-4 py-2 text-right align-middle">
                  <button
                    type="button"
                    onClick={() => deleteRate(rate.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
        {savedMsg && <span className="text-sm text-gray-600">{savedMsg}</span>}
      </div>
    </div>
  );
}


