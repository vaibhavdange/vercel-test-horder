"use client";

import React, { useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { CartAddon } from "@/types/cart";
import { Product } from "@/types/product";
import { useCurrency } from "@/hooks/useCurrency";

interface AddonModalProps {
  product: Product;
  addons: CartAddon[];
  onConfirm: (selectedAddons: CartAddon[]) => void;
  open: boolean;
  onClose: () => void;
}

export default function AddonModal({ product, addons, onConfirm, open, onClose }: AddonModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<CartAddon[]>([]);
  const { format } = useCurrency();

  const toggleAddon = (addon: CartAddon) => {
    setSelectedAddons((prev) => {
      const existing = prev.find((a) => a.id === addon.id);
      if (existing) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedAddons);
    setSelectedAddons([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedAddons([]);
    onClose();
  };

  const totalAddonPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const totalPrice = product.price + totalAddonPrice;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add-ons for {product.name}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">{product.name}</h4>
          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
          <div className="text-lg font-bold text-green-600">{format(product.price)}</div>
        </div>

        {/* Add-ons List */}
        <div className="space-y-3 mb-6">
          <h4 className="font-medium text-gray-900">Select Add-ons</h4>
          {addons.length === 0 ? (
            <p className="text-gray-500 text-sm">No add-ons available for this product.</p>
          ) : (
            addons.map((addon) => {
              const isSelected = selectedAddons.some((a) => a.id === addon.id);
              return (
                <label
                  key={addon.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${
                    isSelected
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAddon(addon)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900">{addon.name}</span>
                    </div>
                  </div>
                  <span className="font-medium text-green-600">+{format(addon.price)}</span>
                </label>
              );
            })
          )}
        </div>

        {/* Total Price */}
        {selectedAddons.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total Price:</span>
              <span className="text-lg font-bold text-green-600">{format(totalPrice)}</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Base: {format(product.price)} + Add-ons: {format(totalAddonPrice)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
