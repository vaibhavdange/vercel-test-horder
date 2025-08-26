"use client";

import React, { useEffect, useState } from "react";

interface BackupEntry { id: string; createdAt: string; status: 'success' | 'failed' | 'pending'; notes?: string }

const STORAGE_KEY = 'settings.backups.history';

export default function DataSettings() {
  const [history, setHistory] = useState<BackupEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {}
  }, [history]);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg(null);
    try {
      await fetch('/api/settings/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history }),
      });
      setSavedMsg('Saved successfully');
    } catch (_) {
      setSavedMsg('Saved locally (backend unavailable)');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 2000);
    }
  };

  const addBackup = (status: BackupEntry['status']) => {
    const entry: BackupEntry = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status,
    };
    setHistory((prev) => [entry, ...prev]);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">Data Management</h3>
        <p className="text-sm text-gray-500">Import/export and backups. Frontend-only placeholders.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700">Import</button>
        <button className="px-4 py-2 rounded-md bg-white text-gray-800 border border-gray-300 text-sm hover:bg-gray-50">Export</button>
        <button onClick={() => addBackup('success')} className="px-4 py-2 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700">Backup Now</button>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-800 mb-2">Backup History</h4>
        <ul className="divide-y divide-gray-200">
          {history.length === 0 && (
            <li className="py-6 text-sm text-gray-500 text-center">No backups yet.</li>
          )}
          {history.map((b) => (
            <li key={b.id} className="py-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{new Date(b.createdAt).toLocaleString()}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                b.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : b.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {b.status === 'success' ? 'Success' : b.status === 'failed' ? 'Failed' : 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
        {savedMsg && <span className="text-sm text-gray-600">{savedMsg}</span>}
      </div>
    </div>
  );
}


