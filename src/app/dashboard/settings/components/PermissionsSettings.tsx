"use client";

import React, { useEffect, useState } from "react";

type Role = 'admin' | 'manager' | 'cashier' | 'waiter' | 'chef';
const ROLES: Role[] = ['admin', 'manager', 'cashier', 'waiter', 'chef'];

const CAPABILITIES = [
  'view_dashboard', 'manage_orders', 'manage_menu', 'manage_inventory', 'manage_staff', 'view_reports', 'manage_tables', 'process_refunds', 'apply_discounts', 'settings_access'
] as const;
type Capability = typeof CAPABILITIES[number];

interface PermissionsState {
  matrix: Record<Role, Record<Capability, boolean>>;
  twoFactorEnabled: boolean;
}

const STORAGE_KEY = 'settings.permissions';

function defaultMatrix(): PermissionsState['matrix'] {
  const m: any = {};
  ROLES.forEach((r) => {
    m[r] = {};
    CAPABILITIES.forEach((c) => {
      m[r][c] = r === 'admin';
    });
  });
  return m as PermissionsState['matrix'];
}

export default function PermissionsSettings() {
  const [state, setState] = useState<PermissionsState>({ matrix: defaultMatrix(), twoFactorEnabled: false });

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
      await fetch('/api/settings/permissions', {
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

  const toggle = (role: Role, cap: Capability) => {
    setState((s) => ({
      ...s,
      matrix: {
        ...s.matrix,
        [role]: { ...s.matrix[role], [cap]: !s.matrix[role][cap] },
      },
    }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">Role Permissions</h3>
        <p className="text-sm text-gray-500">Frontend-only matrix. No backend yet.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Role</th>
              {CAPABILITIES.map((cap) => (
                <th key={cap} className="px-2 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap">{cap.replaceAll('_', ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role) => (
              <tr key={role} className="border-t border-gray-200">
                <td className="px-4 py-2 text-sm font-medium capitalize text-gray-800">{role}</td>
                {CAPABILITIES.map((cap) => (
                  <td key={cap} className="px-2 py-2">
                    <input type="checkbox" checked={state.matrix[role][cap]} onChange={() => toggle(role, cap)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <label className="inline-flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-2">
          <input type="checkbox" checked={state.twoFactorEnabled} onChange={(e) => setState({ ...state, twoFactorEnabled: e.target.checked })} />
          <span>Require 2FA for admin access</span>
        </label>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
        {savedMsg && <span className="text-sm text-gray-600">{savedMsg}</span>}
      </div>
    </div>
  );
}


