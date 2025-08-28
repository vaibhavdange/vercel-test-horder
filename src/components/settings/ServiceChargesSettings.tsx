"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, Settings } from "lucide-react";
import { useBillingSettings, useCreateBillingSetting } from "@/hooks/use-billing-settings";
import { useDefaultServiceChargeRate, useDefaultTaxRate } from "@/hooks/use-billing-settings";

interface ServiceChargeConfig {
  defaultServiceChargeRate: number;
  defaultTaxRate: number;
  serviceChargeEnabled: boolean;
  taxEnabled: boolean;
  roundToNearest: number;
  applyToDelivery: boolean;
  applyToTakeaway: boolean;
  applyToDineIn: boolean;
}

interface ServiceChargesSettingsProps {
  className?: string;
}

export default function ServiceChargesSettings({ className = '' }: ServiceChargesSettingsProps) {
  const [config, setConfig] = useState<ServiceChargeConfig>({
    defaultServiceChargeRate: 0,
    defaultTaxRate: 0,
    serviceChargeEnabled: true,
    taxEnabled: true,
    roundToNearest: 0,
    applyToDelivery: true,
    applyToTakeaway: false,
    applyToDineIn: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const { data: billingSettings = [] } = useBillingSettings();
  const createBillingSetting = useCreateBillingSetting();
  
  const { data: defaultServiceChargeRate = 0 } = useDefaultServiceChargeRate();
  const { data: defaultTaxRate = 0 } = useDefaultTaxRate();

  // Multiple tax types configuration (e.g., CGST, SGST)
  type TaxType = { id: string; name: string; ratePercent: number };
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [newTax, setNewTax] = useState<{ name: string; ratePercent: string }>({ name: "", ratePercent: "" });

  useEffect(() => {
    if (defaultServiceChargeRate !== undefined) {
      setConfig(prev => ({ ...prev, defaultServiceChargeRate }));
    }
    if (defaultTaxRate !== undefined) {
      setConfig(prev => ({ ...prev, defaultTaxRate }));
    }
  }, [defaultServiceChargeRate, defaultTaxRate]);

  // Load toggles and tax types from billing settings (server source of truth)
  useEffect(() => {
    try {
      const keyToValue: Record<string, string> = {};
      for (const s of billingSettings) keyToValue[s.key] = s.value;
      if (keyToValue['service_charge_enabled']) {
        setConfig(prev => ({ ...prev, serviceChargeEnabled: keyToValue['service_charge_enabled'] === 'true' }));
      }
      if (keyToValue['tax_enabled']) {
        setConfig(prev => ({ ...prev, taxEnabled: keyToValue['tax_enabled'] === 'true' }));
      }
      if (keyToValue['tax_types']) {
        try {
          const parsed = JSON.parse(keyToValue['tax_types']);
          if (Array.isArray(parsed)) {
            setTaxTypes(parsed.map((t: any) => ({ id: String(t.id || `${Date.now()}_${Math.random().toString(36).slice(2,8)}`), name: String(t.name || ''), ratePercent: Number(t.ratePercent || 0) })));
          }
        } catch {}
      }
    } catch {}
  }, [billingSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      // Save default service charge rate
      await createBillingSetting.mutateAsync({
        key: "default_service_charge_rate",
        value: config.defaultServiceChargeRate.toString(),
        description: "Default service charge rate for all orders",
        isActive: true,
      });

      // Save default tax rate
      await createBillingSetting.mutateAsync({
        key: "default_tax_rate",
        value: config.defaultTaxRate.toString(),
        description: "Default tax rate for all orders",
        isActive: true,
      });

      // Save other settings
      await createBillingSetting.mutateAsync({
        key: "service_charge_enabled",
        value: config.serviceChargeEnabled.toString(),
        description: "Whether service charges are enabled",
        isActive: true,
      });

      await createBillingSetting.mutateAsync({
        key: "tax_enabled",
        value: config.taxEnabled.toString(),
        description: "Whether taxes are enabled",
        isActive: true,
      });

      // Save tax types array as JSON
      await createBillingSetting.mutateAsync({
        key: "tax_types",
        value: JSON.stringify(taxTypes.map(t => ({ id: t.id, name: t.name, ratePercent: t.ratePercent }))),
        description: "List of tax types and percentages",
        isActive: true,
      });

      await createBillingSetting.mutateAsync({
        key: "round_to_nearest",
        value: config.roundToNearest.toString(),
        description: "Round amounts to nearest value (0 = no rounding)",
        isActive: true,
      });

      await createBillingSetting.mutateAsync({
        key: "apply_to_delivery",
        value: config.applyToDelivery.toString(),
        description: "Apply service charges to delivery orders",
        isActive: true,
      });

      await createBillingSetting.mutateAsync({
        key: "apply_to_takeaway",
        value: config.applyToTakeaway.toString(),
        description: "Apply service charges to takeaway orders",
        isActive: true,
      });

      await createBillingSetting.mutateAsync({
        key: "apply_to_dine_in",
        value: config.applyToDineIn.toString(),
        description: "Apply service charges to dine-in orders",
        isActive: true,
      });

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      defaultServiceChargeRate: defaultServiceChargeRate || 0,
      defaultTaxRate: defaultTaxRate || 0,
      serviceChargeEnabled: true,
      taxEnabled: true,
      roundToNearest: 0,
      applyToDelivery: true,
      applyToTakeaway: false,
      applyToDineIn: true,
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus === "success" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-800">
            <Settings className="h-5 w-5" />
            <span className="font-medium">Settings saved successfully!</span>
          </div>
        </div>
      )}

      {saveStatus === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <Settings className="h-5 w-5" />
            <span className="font-medium">Failed to save settings. Please try again.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Charge Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-blue-600" />
            Service Charge Settings
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.serviceChargeEnabled}
                  onChange={(e) => setConfig({ ...config, serviceChargeEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Service Charges</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Service Charge Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={config.defaultServiceChargeRate}
                onChange={(e) => setConfig({ ...config, defaultServiceChargeRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 10.0"
              />
              <p className="text-xs text-gray-500 mt-1">
                This rate will be applied to all orders unless overridden at the product level
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply Service Charges To:
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.applyToDineIn}
                    onChange={(e) => setConfig({ ...config, applyToDineIn: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Dine-in Orders</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.applyToDelivery}
                    onChange={(e) => setConfig({ ...config, applyToDelivery: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Delivery Orders</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.applyToTakeaway}
                    onChange={(e) => setConfig({ ...config, applyToTakeaway: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Takeaway Orders</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-green-600" />
            Tax Settings
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.taxEnabled}
                  onChange={(e) => setConfig({ ...config, taxEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Taxes</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={config.defaultTaxRate}
                onChange={(e) => setConfig({ ...config, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., 18.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                This rate will be applied to all orders unless overridden at the product level
              </p>
            </div>

            {/* Tax Types list and add form */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-900">Tax Types</h3>
                <p className="text-xs text-gray-500">Add multiple tax components like CGST/SGST.</p>
              </div>
              <div className="space-y-3">
                {taxTypes.length === 0 && (
                  <div className="text-sm text-gray-500">No tax types added yet.</div>
                )}
                {taxTypes.map((t, idx) => (
                  <div key={t.id} className="grid grid-cols-5 gap-2 items-center">
                    <input
                      value={t.name}
                      onChange={(e) => setTaxTypes(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                      placeholder="e.g., CGST"
                      className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <div className="col-span-1 flex items-center">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={t.ratePercent}
                        onChange={(e) => setTaxTypes(prev => prev.map((x, i) => i === idx ? { ...x, ratePercent: parseFloat(e.target.value) || 0 } : x))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <span className="ml-1 text-sm text-gray-600">%</span>
                    </div>
                    <button
                      onClick={() => setTaxTypes(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-600 text-sm"
                    >Remove</button>
                  </div>
                ))}
              </div>

              {/* Add new tax form */}
              <div className="mt-4 grid grid-cols-5 gap-2 items-center">
                <input
                  value={newTax.name}
                  onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
                  placeholder="Tax name (e.g., SGST)"
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="col-span-1 flex items-center">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newTax.ratePercent}
                    onChange={(e) => setNewTax({ ...newTax, ratePercent: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="ml-1 text-sm text-gray-600">%</span>
                </div>
                <button
                  onClick={() => {
                    if (!newTax.name.trim()) return;
                    const rate = parseFloat(newTax.ratePercent || '0');
                    setTaxTypes(prev => [{ id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`, name: newTax.name.trim(), ratePercent: isNaN(rate) ? 0 : rate }, ...prev]);
                    setNewTax({ name: "", ratePercent: "" });
                  }}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm"
                >Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rounding Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-purple-600" />
          Rounding & Display
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Round to Nearest
            </label>
            <select
              value={config.roundToNearest}
              onChange={(e) => setConfig({ ...config, roundToNearest: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={0}>No rounding</option>
              <option value={1}>1</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Automatically round final amounts for customer convenience
            </p>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">How It Works</h2>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p>Service charges and taxes are calculated automatically based on your settings</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p>Individual products can override these default rates</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p>Changes take effect immediately for new orders</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p>Rounding helps with cash transactions and customer experience</p>
          </div>
        </div>
      </div>
    </div>
  );
}
