"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTables } from '@/hooks/useTables';
import { CreateTableRequest, TableStatus } from '@/types/tables';
import PaymentMethodsSettings from '@/components/settings/PaymentMethodsSettings';
import ServiceChargesSettings from '@/components/settings/ServiceChargesSettings';
import DevelopmentNotice from '@/components/ui/DevelopmentNotice';
import TimezoneSettings from '@/components/ui/TimezoneSettings';
import { useSettings } from '@/hooks/useSettings';

export default function SettingsPage() {
  const {
    floors,
    areas,
    tables,
    createFloorMutation,
    createAreaMutation,
    createTableMutation,
  } = useTables();

  const { settings, updateSettings, isLoading } = useSettings();

  type SettingsTabKey = 'general' | 'tax' | 'tables' | 'data' | 'customers' | 'permissions' | 'print' | 'payments';
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('general');
  const [showTimezoneSettings, setShowTimezoneSettings] = useState(false);

  interface GeneralSettingsState {
    restaurantName: string;
    location: string;
    restaurantId: string;
    storeId: string;
    currency: string;
    timezone: string;
    contactEmail: string;
    contactPhone: string;
    receiptFooter: string;
  }

  const defaultGeneral: GeneralSettingsState = {
    restaurantName: '',
    location: '',
    restaurantId: '',
    storeId: '',
    currency: 'INR',
    timezone: 'UTC',
    contactEmail: '',
    contactPhone: '',
    receiptFooter: '',
  };

  const [general, setGeneral] = useState<GeneralSettingsState>(defaultGeneral);

  // Sync general state with settings from hook
  useEffect(() => {
    if (settings && !isLoading) {
      setGeneral(prev => ({
        ...prev,
        restaurantName: settings.restaurantName,
        location: settings.location,
        restaurantId: settings.restaurantId,
        storeId: settings.storeId,
        currency: settings.currency,
        timezone: settings.timezone,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        receiptFooter: settings.receiptFooter,
      }));
    }
  }, [settings, isLoading]);

  const handleSaveGeneralSettings = () => {
    try {
      // Update the settings using our hook
      updateSettings(general);
      
      // Dispatch events for currency changes
      window.dispatchEvent(new CustomEvent('settings:currencyChanged'));
      
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  const tabs: { key: SettingsTabKey; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'tax', label: 'Tax & Service' },
    { key: 'tables', label: 'Tables' },
    { key: 'data', label: 'Data' },
    { key: 'customers', label: 'Customers' },
    { key: 'permissions', label: 'Permissions' },
    { key: 'print', label: 'Print' },
    { key: 'payments', label: 'Payments' },
  ];

  const [showAddFloor, setShowAddFloor] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const DataSettings = useMemo(() => dynamic(() => import('./components/DataSettings'), { ssr: false }), []);
  const CustomersSettings = useMemo(() => dynamic(() => import('./components/CustomersSettings'), { ssr: false }), []);
  const PermissionsSettings = useMemo(() => dynamic(() => import('./components/PermissionsSettings'), { ssr: false }), []);
  const PrintSettings = useMemo(() => dynamic(() => import('./components/PrintSettings'), { ssr: false }), []);

  const handleCreateFloor = (data: { name: string; description?: string }) => {
    createFloorMutation.mutate(data, { onSuccess: () => setShowAddFloor(false) });
  };

  const handleCreateArea = (data: { name: string; description?: string; floorId: string }) => {
    createAreaMutation.mutate(data, { onSuccess: () => setShowAddArea(false) });
  };

  const handleCreateTable = (data: CreateTableRequest & { status?: TableStatus }) => {
    const newDisplayOrder = tables.length > 0 ? Math.max(...tables.map(t => t.displayOrder)) + 1 : 0;
    const payload: CreateTableRequest = {
      tableNumber: data.tableNumber,
      capacity: data.capacity,
      areaId: data.areaId,
      floorId: data.floorId,
      displayOrder: newDisplayOrder,
    };
    createTableMutation.mutate(payload, { onSuccess: () => setShowAddTable(false) });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        

        <div className="mb-6">
          <div className="w-full overflow-x-auto">
            <div className="flex items-center gap-2">
              {tabs.map(({ key, label }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    aria-pressed={isActive}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'text-green-600 bg-green-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {activeTab === 'general' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Business Profile</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant name</label>
                <input
                  type="text"
                  value={general.restaurantName}
                  onChange={(e) => setGeneral({ ...general, restaurantName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Horder Bistro"
                />
              </div>
              <div className="grid grid-cols-1 sm-grid-cols-2 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant ID</label>
                  <input
                    type="text"
                    value={general.restaurantId}
                    onChange={(e) => setGeneral({ ...general, restaurantId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., REST-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store ID</label>
                  <input
                    type="text"
                    value={general.storeId}
                    onChange={(e) => setGeneral({ ...general, storeId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., STORE-101"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={general.location}
                  onChange={(e) => setGeneral({ ...general, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Address, City, Country"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={general.currency}
                    onChange={(e) => {
                      const newCurrency = e.target.value;
                      const next = { ...general, currency: newCurrency };
                      setGeneral(next);
                      updateSettings(next);
                      window.dispatchEvent(new CustomEvent('settings:currencyChanged'));
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                    <option value="AED">AED</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={general.timezone}
                      onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., Asia/Dubai"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTimezoneSettings(true)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      title="Configure regional timezone settings"
                    >
                      <Globe className="w-4 h-4" />
                      <span className="hidden sm:inline">Regional</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact email</label>
                  <input
                    type="email"
                    value={general.contactEmail}
                    onChange={(e) => setGeneral({ ...general, contactEmail: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="info@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact phone</label>
                  <input
                    type="tel"
                    value={general.contactPhone}
                    onChange={(e) => setGeneral({ ...general, contactPhone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="+91 9012345678"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt footer</label>
                <textarea
                  value={general.receiptFooter}
                  onChange={(e) => setGeneral({ ...general, receiptFooter: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Thank you for dining with us!"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSaveGeneralSettings}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <ServiceChargesSettings />
        )}

        {activeTab === 'tables' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowAddFloor(true)}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50"
              >
                <div className="text-sm text-gray-500">Floors</div>
                <div className="text-lg font-medium text-gray-900">Add Floor</div>
              </button>
              <button
                onClick={() => setShowAddArea(true)}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50"
              >
                <div className="text-sm text-gray-500">Areas</div>
                <div className="text-lg font-medium text-gray-900">Add Area</div>
              </button>
              <button
                onClick={() => setShowAddTable(true)}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50"
              >
                <div className="text-sm text-gray-500">Tables</div>
                <div className="text-lg font-medium text-gray-900">Add Table</div>
              </button>
            </div>
            <div className="mt-6">
              <button
                onClick={() => {
                  alert('Tables settings saved successfully!');
                }}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <DataSettings />
        )}

        {activeTab === 'customers' && (
          <CustomersSettings />
        )}

        {activeTab === 'permissions' && (
          <PermissionsSettings />
        )}

        {activeTab === 'print' && (
          <PrintSettings />
        )}

        {activeTab === 'payments' && (
          <PaymentMethodsSettings />
        )}

        {activeTab === 'tables' && showAddFloor && (
          <FloorModal onClose={() => setShowAddFloor(false)} onSubmit={handleCreateFloor} />
        )}

        {activeTab === 'tables' && showAddArea && (
          <AreaModal floors={floors} onClose={() => setShowAddArea(false)} onSubmit={handleCreateArea} />
        )}

        {activeTab === 'tables' && showAddTable && (
          <TableModal floors={floors} areas={areas} onClose={() => setShowAddTable(false)} onSubmit={handleCreateTable} />
        )}
        {/* Timezone Settings Modal */}
        <TimezoneSettings 
          isOpen={showTimezoneSettings} 
          onClose={() => setShowTimezoneSettings(false)} 
        />

        <DevelopmentNotice />
      </div>
    </div>
  );
}

function FloorModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: { name: string; description?: string }) => void; }) {
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Floor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Ground Floor, First Floor"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors border border-gray-300">Cancel</button>
            <button type="submit" className="flex-1 bg-emerald-200 text-emerald-800 py-2 rounded-lg hover:bg-emerald-300 transition-colors border border-emerald-300">Create Floor</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AreaModal({ floors, onClose, onSubmit }: { floors: any[]; onClose: () => void; onSubmit: (data: { name: string; description?: string; floorId: string }) => void; }) {
  const [formData, setFormData] = useState({ name: '', description: '', floorId: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.floorId) onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Area</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select
              value={formData.floorId}
              onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a floor</option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>{floor.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Main Dining, Bar Area, Outdoor"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors border border-gray-300">Cancel</button>
            <button type="submit" className="flex-1 bg-violet-200 text-violet-800 py-2 rounded-lg hover:bg-violet-300 transition-colors border border-violet-300">Create Area</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TableModal({ floors, areas, onClose, onSubmit }: { floors: any[]; areas: any[]; onClose: () => void; onSubmit: (data: CreateTableRequest & { status?: TableStatus }) => void; }) {
  const [selectedFloor, setSelectedFloor] = useState('');
  const [formData, setFormData] = useState({ tableNumber: '', capacity: 4, areaId: '', floorId: '', status: 'available' as TableStatus });

  const availableAreas = areas.filter(area => area.floorId === selectedFloor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.tableNumber && formData.areaId && formData.floorId) onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Table</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select
              value={selectedFloor}
              onChange={(e) => { setSelectedFloor(e.target.value); setFormData({ ...formData, floorId: e.target.value, areaId: '' }); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a floor</option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>{floor.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
            <select
              value={formData.areaId}
              onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!selectedFloor}
            >
              <option value="">Select an area</option>
              {availableAreas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
            <input
              type="text"
              value={formData.tableNumber}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1, 2, VIP-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="20"
              required
            />
          </div>
          <div className="flex items-center justify-between gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200">Cancel</button>
            <button type="submit" className="px-3 py-1.5 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
