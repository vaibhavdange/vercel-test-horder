"use client";

import { useState, useEffect } from "react";
import { useBillingSettings, useCreateBillingSetting, useUpdateBillingSetting } from "@/hooks/use-billing-settings";
import { BillingSettings } from "@/types/orders";
import { Save, Loader2, CheckCircle } from "lucide-react";

interface BillingSettingsProps {
  className?: string;
}

export default function BillingSettingsComponent({ className = '' }: BillingSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderButtonAction, setOrderButtonAction] = useState<string>("create_order");
  
  const { data: billingSettings = [], isLoading: settingsLoading } = useBillingSettings();
  const createBillingSetting = useCreateBillingSetting();
  const updateBillingSetting = useUpdateBillingSetting();

  // Load existing order button action setting
  useEffect(() => {
    const orderButtonSetting = billingSettings.find(setting => setting.key === "order_button_action");
    if (orderButtonSetting) {
      setOrderButtonAction(orderButtonSetting.value);
    }
  }, [billingSettings]);

  const handleSaveOrderButtonAction = async () => {
    setIsLoading(true);
    setShowSuccess(false);

    try {
      const existingSetting = billingSettings.find(setting => setting.key === "order_button_action");
      
      if (existingSetting) {
        // Update existing setting
        await updateBillingSetting.mutateAsync({
          id: existingSetting.id,
          data: {
            value: orderButtonAction,
            description: "Action performed by the Create Order button in new order page"
          }
        });
      } else {
        // Create new setting
        await createBillingSetting.mutateAsync({
          key: "order_button_action",
          value: orderButtonAction,
          description: "Action performed by the Create Order button in new order page"
        });
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save order button action setting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const orderButtonOptions = [
    {
      value: "create_order",
      label: "Create Order",
      description: "Creates a new order and sends it to the orders page"
    },
    {
      value: "create_order_print_kot",
      label: "Create Order & Print KOT",
      description: "Creates a new order, sends it to orders page, and prints KOT"
    },
    {
      value: "create_order_print_bill",
      label: "Create Order & Print Bill (Unpaid)",
      description: "Creates a new order, sends it to orders page, and prints Bill with unpaid status"
    },
    {
      value: "create_order_pay",
      label: "Create Order & Pay",
      description: "Creates a new order, sends it to orders page, opens payment drawer, and prints Bill with paid status once paid"
    }
  ];

  if (settingsLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Taxes & Service toggles quick access */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing: Taxes & Service</h2>
        <p className="text-sm text-gray-600 mb-4">Configure tax and service charge options in the Service Charge Settings tab. This section uses values from billing settings.</p>
        <div className="text-sm text-gray-500">Go to Settings → Payments → Service Charge Settings for detailed controls.</div>
      </div>
      {/* Order Button Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Order Button Configuration</h2>
            <p className="text-gray-600">Configure what happens when the Create Order button is clicked</p>
          </div>
          {showSuccess && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Settings saved!</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {orderButtonOptions.map((option) => (
            <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="orderButtonAction"
                value={option.value}
                checked={orderButtonAction === option.value}
                onChange={(e) => setOrderButtonAction(e.target.value)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Changes will take effect immediately on the new order page
          </div>
          <button
            onClick={handleSaveOrderButtonAction}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Additional Billing Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Billing Settings</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Save className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">More billing configuration options will be available here</p>
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm mt-4">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span>Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
