"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, DollarSign } from "lucide-react";

interface CashButton {
  id: string;
  amount: number;
  label: string;
}

interface CashButtonSettingsProps {
  className?: string;
}

export default function CashButtonSettings({ className = '' }: CashButtonSettingsProps) {
  const [cashButtons, setCashButtons] = useState<CashButton[]>([
    { id: "1", amount: 100, label: "100" },
    { id: "2", amount: 50, label: "50" }
  ]);
  const [newAmount, setNewAmount] = useState<string>("");
  const [newLabel, setNewLabel] = useState<string>("");

  // Load saved configuration on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('settings.cashButtons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCashButtons(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading cash button settings:', error);
    }
  }, []);

  // Save configuration to localStorage
  const saveConfiguration = (buttons: CashButton[]) => {
    try {
      localStorage.setItem('settings.cashButtons', JSON.stringify(buttons));
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('settings:cashButtonsChanged', { detail: buttons }));
    } catch (error) {
      console.error('Error saving cash button settings:', error);
    }
  };

  const handleAddButton = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const label = newLabel.trim() || amount.toString();
    const newButton: CashButton = {
      id: Date.now().toString(),
      amount,
      label
    };
    
    const updatedButtons = [...cashButtons, newButton];
    setCashButtons(updatedButtons);
    saveConfiguration(updatedButtons);
    
    // Reset form
    setNewAmount("");
    setNewLabel("");
  };

  const handleRemoveButton = (id: string) => {
    const updatedButtons = cashButtons.filter(button => button.id !== id);
    setCashButtons(updatedButtons);
    saveConfiguration(updatedButtons);
  };

  const handleUpdateButton = (id: string, updates: Partial<CashButton>) => {
    const updatedButtons = cashButtons.map(button => 
      button.id === id ? { ...button, ...updates } : button
    );
    setCashButtons(updatedButtons);
    saveConfiguration(updatedButtons);
  };

  const handleSaveAll = () => {
    saveConfiguration(cashButtons);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">Cash Payment Buttons</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure quick cash payment buttons for faster transactions. These buttons will appear when customers pay with cash.
        </p>
      </div>

      {/* Current Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-700">Current Buttons</h4>
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save All
          </button>
        </div>

        {cashButtons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No cash buttons configured</p>
            <p className="text-sm">Add buttons below to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashButtons.map((button) => (
              <div key={button.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-gray-900">
                    {button.label}
                  </span>
                  <button
                    onClick={() => handleRemoveButton(button.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={button.amount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          handleUpdateButton(button.id, { amount: value });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Label
                    </label>
                    <input
                      type="text"
                      value={button.label}
                      onChange={(e) => handleUpdateButton(button.id, { label: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 100, 200, 500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Button */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-blue-900 mb-3">Add New Button</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 200"
              min="0.01"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Display Label (Optional)
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 200, 500"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={handleAddButton}
            disabled={!newAmount || parseFloat(newAmount) <= 0}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Button
          </button>
        </div>
      </div>

      {/* Preset Suggestions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-700 mb-3">Common Presets</h4>
        <p className="text-sm text-gray-600 mb-3">
          Common denominations for different regions:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { amount: 100, label: "100", region: "US/EU" },
            { amount: 50, label: "50", region: "US/EU" },
            { amount: 200, label: "200", region: "India" },
            { amount: 500, label: "500", region: "India" },
            { amount: 1000, label: "1000", region: "India" },
            { amount: 2000, label: "2000", region: "India" },
            { amount: 20, label: "20", region: "US/EU" },
            { amount: 10, label: "10", region: "US/EU" }
          ].map((preset) => (
            <button
              key={preset.amount}
              onClick={() => {
                setNewAmount(preset.amount.toString());
                setNewLabel(preset.label);
              }}
              className="text-left p-2 text-sm border border-gray-200 rounded bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">{preset.label}</div>
              <div className="text-xs text-gray-500">{preset.region}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
