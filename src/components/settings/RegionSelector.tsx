"use client";

import { useState, useEffect } from 'react';
import { Globe, MapPin, Check, ChevronDown, Settings } from 'lucide-react';
import { useRegion } from '@/hooks/use-region';
import { regions } from '@/lib/data/regions';
import { Region, TaxRule } from '@/types/restaurant';

interface RegionSelectorProps {
  className?: string;
}

export default function RegionSelector({ className = '' }: RegionSelectorProps) {
  const { currentRegion, setRegion, regions: availableRegions } = useRegion();
  
  // Add null checks and default values
  const defaultRegion = availableRegions[0] || regions[0];
  const safeCurrentRegion = currentRegion || defaultRegion;
  
  const [selectedRegion, setSelectedRegion] = useState<Region>(safeCurrentRegion);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isDateFormatOpen, setIsDateFormatOpen] = useState(false);
  const [isTimeFormatOpen, setIsTimeFormatOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [customTaxRules, setCustomTaxRules] = useState<TaxRule[]>(safeCurrentRegion?.taxRules || []);

  useEffect(() => {
    if (currentRegion) {
      setSelectedRegion(currentRegion);
      setCustomTaxRules(currentRegion.taxRules || []);
    }
  }, [currentRegion]);

  const handleRegionChange = (region: Region) => {
    setSelectedRegion(region);
    setRegion(region);
    setCustomTaxRules(region.taxRules || []);
    setIsRegionOpen(false);
  };

  const handleDateFormatChange = (format: string) => {
    setSelectedRegion(prev => ({ ...prev, dateFormat: format }));
    setIsDateFormatOpen(false);
  };

  const handleTimeFormatChange = (format: '12h' | '24h') => {
    setSelectedRegion(prev => ({ ...prev, timeFormat: format }));
    setIsTimeFormatOpen(false);
  };

  const handleCurrencyChange = (currency: string, symbol: string) => {
    setSelectedRegion(prev => ({ ...prev, currency, currencySymbol: symbol }));
    setIsCurrencyOpen(false);
  };

  const handleTaxRuleChange = (index: number, field: keyof TaxRule, value: any) => {
    const updatedRules = [...customTaxRules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    setCustomTaxRules(updatedRules);
  };

  const addTaxRule = () => {
    const newRule: TaxRule = {
      id: Date.now().toString(),
      name: 'Custom Tax',
      rate: 0,
      appliesTo: 'all',
      isActive: true,
    };
    setCustomTaxRules([...customTaxRules, newRule]);
  };

  const removeTaxRule = (index: number) => {
    const updatedRules = customTaxRules.filter((_, i) => i !== index);
    setCustomTaxRules(updatedRules);
  };

  const saveSettings = () => {
    const updatedRegion = {
      ...selectedRegion,
      taxRules: customTaxRules,
    };
    setRegion(updatedRegion);
  };

  const autoDetectRegion = async () => {
    setAutoDetecting(true);
    
    try {
      // Simulate auto-detection based on restaurant address/state/country
      const detectedRegion = await detectRegionFromAddress();
      if (detectedRegion) {
        setSelectedRegion(detectedRegion);
        setCustomTaxRules(detectedRegion.taxRules || []);
        setRegion(detectedRegion);
      }
    } catch (error) {
      console.error('Auto-detection failed:', error);
    } finally {
      setAutoDetecting(false);
    }
  };

  const detectRegionFromAddress = async (): Promise<Region | null> => {
    // Simulate API call to detect region from address
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, randomly select a region
    const randomIndex = Math.floor(Math.random() * availableRegions.length);
    return availableRegions[randomIndex];
  };

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
  ];

  const timeFormats: { value: '12h' | '24h'; label: string }[] = [
    { value: '12h', label: '12 Hour (AM/PM)' },
    { value: '24h', label: '24 Hour' },
  ];

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Region Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Region</label>
            <div className="relative">
              <button
                onClick={() => setIsRegionOpen(!isRegionOpen)}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {selectedRegion.currencySymbol}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">{selectedRegion.name}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRegionOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {availableRegions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => handleRegionChange(region)}
                      className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                        selectedRegion.id === region.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {region.currencySymbol}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{region.name}</span>
                      </div>
                      {selectedRegion.id === region.id && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date Format */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Date Format</label>
            <div className="relative">
              <button
                onClick={() => setIsDateFormatOpen(!isDateFormatOpen)}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <span className="font-medium text-gray-900">{selectedRegion.dateFormat}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDateFormatOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDateFormatOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  {dateFormats.map((format) => (
                    <button
                      key={format.value}
                      onClick={() => handleDateFormatChange(format.value)}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                        selectedRegion.dateFormat === format.value ? 'bg-blue-50 text-blue-900' : ''
                      }`}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Time Format */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Time Format</label>
            <div className="relative">
              <button
                onClick={() => setIsTimeFormatOpen(!isTimeFormatOpen)}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <span className="font-medium text-gray-900">
                  {selectedRegion.timeFormat === '12h' ? '12 Hour (AM/PM)' : '24 Hour'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isTimeFormatOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTimeFormatOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  {timeFormats.map((format) => (
                    <button
                      key={format.value}
                      onClick={() => handleTimeFormatChange(format.value)}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                        selectedRegion.timeFormat === format.value ? 'bg-blue-50 text-blue-900' : ''
                      }`}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Currency */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Currency</label>
            <div className="relative">
              <button
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{selectedRegion.currencySymbol}</span>
                  <span className="font-medium text-gray-900">{selectedRegion.currency}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCurrencyOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  {currencies.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => handleCurrencyChange(currency.code, currency.symbol)}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                        selectedRegion.currency === currency.code ? 'bg-blue-50 text-blue-900' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{currency.symbol}</span>
                        <div>
                          <div className="font-medium">{currency.code}</div>
                          <div className="text-sm text-gray-500">{currency.name}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Tax Configuration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Tax Configuration</h4>
              <button
                onClick={addTaxRule}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50"
              >
                + Add Tax Rule
              </button>
            </div>
            
            <div className="space-y-4">
              {customTaxRules.map((rule, index) => (
                <div key={rule.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={(e) => handleTaxRuleChange(index, 'isActive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  
                  <input
                    type="text"
                    value={rule.name}
                    onChange={(e) => handleTaxRuleChange(index, 'name', e.target.value)}
                    placeholder="Tax Name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <input
                    type="number"
                    value={rule.rate * 100}
                    onChange={(e) => handleTaxRuleChange(index, 'rate', Number(e.target.value) / 100)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  />
                  
                  <span className="text-gray-500">%</span>
                  
                  <select
                    value={rule.appliesTo}
                    onChange={(e) => handleTaxRuleChange(index, 'appliesTo', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Items</option>
                    <option value="food">Food Only</option>
                    <option value="beverages">Beverages Only</option>
                    <option value="services">Services Only</option>
                  </select>
                  
                  <button
                    onClick={() => removeTaxRule(index)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Current Region Info */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Current Configuration</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Country:</span>
                <span className="font-medium">{selectedRegion.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Currency:</span>
                <span className="font-medium">{selectedRegion.currency} ({selectedRegion.currencySymbol})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date Format:</span>
                <span className="font-medium">{selectedRegion.dateFormat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time Format:</span>
                <span className="font-medium">{selectedRegion.timeFormat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Active Tax Rules:</span>
                <span className="font-medium">{customTaxRules.filter(r => r.isActive).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={autoDetectRegion}
          disabled={autoDetecting}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 rounded-md hover:bg-blue-50"
        >
          <MapPin className="h-4 w-4" />
          {autoDetecting ? 'Detecting...' : 'Auto-detect'}
        </button>
        <button
          onClick={saveSettings}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Save Changes
        </button>
      </div>

      {/* Note about future features */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-blue-600">i</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Region-specific features coming soon:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Custom tax rules and rates</li>
              <li>Region-specific invoice templates</li>
              <li>Localized date and time formats</li>
              <li>Currency-specific pricing rules</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
