"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function SetupSampleDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const populateSampleData = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/setup/populate-sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to populate sample data');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-strong p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-600 mb-2">Sample Data Setup</h1>
            <p className="text-gray-600">Populate your database with Indian fine dining menu and inventory</p>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What will be added:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 8 Menu Categories (Appetizers, Soups, Tandoori, etc.)</li>
                <li>• 19 Menu Items (Pani Puri, Butter Chicken, Biryani, etc.)</li>
                <li>• 18 Inventory Items (Proteins, Vegetables, Spices, etc.)</li>
              </ul>
            </div>

            {/* Action Button */}
            <button
              onClick={populateSampleData}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Populating Data...</span>
                </div>
              ) : (
                "Populate Sample Data"
              )}
            </button>

            {/* Success Message */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Success!</h3>
                </div>
                <p className="text-sm text-green-800 mt-2">{result.message}</p>
                {result.summary && (
                  <div className="mt-3 text-sm text-green-700">
                    <p>• Categories: {result.summary.categories}</p>
                    <p>• Menu Items: {result.summary.menuItems}</p>
                    <p>• Inventory Items: {result.summary.inventoryItems}</p>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Error</h3>
                </div>
                <p className="text-sm text-red-800 mt-2">{error}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="text-center pt-4">
              <a
                href="/dashboard"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
