"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { CartVariant } from "@/types/cart";
import { Product } from "@/types/product";
import { useCurrency } from "@/hooks/useCurrency";

interface VariantModalProps {
  product: Product;
  variants: CartVariant[];
  onConfirm: (selectedVariant: CartVariant) => void;
  open: boolean;
  onClose: () => void;
}

export default function VariantModal({ product, variants, onConfirm, open, onClose }: VariantModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<CartVariant | null>(null);
  const { format } = useCurrency();

  const handleConfirm = () => {
    if (selectedVariant) {
      onConfirm(selectedVariant);
      setSelectedVariant(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedVariant(null);
    onClose();
  };

  const totalPrice = selectedVariant ? product.price + selectedVariant.price : product.price;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Select Variant for {product.name}</h3>
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

        {/* Variants List */}
        <div className="space-y-3 mb-6">
          <h4 className="font-medium text-gray-900">Select Variant</h4>
          {variants.length === 0 ? (
            <p className="text-gray-500 text-sm">No variants available for this product.</p>
          ) : (
            variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              return (
                <label
                  key={variant.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="variant"
                      value={variant.id}
                      checked={isSelected}
                      onChange={() => setSelectedVariant(variant)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900">{variant.name}</span>
                    </div>
                  </div>
                  <span className="font-medium text-blue-600">
                    {variant.price > 0 ? `+${format(variant.price)}` : "No extra cost"}
                  </span>
                </label>
              );
            })
          )}
        </div>

        {/* Total Price */}
        {selectedVariant && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total Price:</span>
              <span className="text-lg font-bold text-blue-600">{format(totalPrice)}</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Base: {format(product.price)} + Variant: {format(selectedVariant.price)}
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
            disabled={!selectedVariant}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
