"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { Product, ProductExtra, ProductVariant } from "@/types/product";
import { CartAddon, CartVariant } from "@/types/cart";

interface ItemOptionsModalProps {
  product: Product;
  addons: ProductExtra[];
  variants: ProductVariant[];
  open: boolean;
  onConfirm: (selectedAddons: CartAddon[], selectedVariant?: CartVariant | null) => void;
  onClose: () => void;
  // New props for editing existing items
  existingAddons?: CartAddon[];
  existingVariant?: CartVariant | null;
  isEditing?: boolean;
}

export default function ItemOptionsModal({ 
  product, 
  addons, 
  variants, 
  open, 
  onConfirm, 
  onClose, 
  existingAddons = [], 
  existingVariant = null, 
  isEditing = false 
}: ItemOptionsModalProps) {
  const { format } = useCurrency();
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Initialize state with existing values when editing
  React.useEffect(() => {
    if (isEditing && open) {
      setSelectedAddonIds(new Set(existingAddons.map(addon => addon.id)));
      setSelectedVariantId(existingVariant?.id || null);
    } else if (!isEditing && open) {
      // Reset to empty state for new items
      setSelectedAddonIds(new Set());
      setSelectedVariantId(null);
    }
  }, [isEditing, open, existingAddons, existingVariant]);

  const toggleAddon = (id: string) => {
    setSelectedAddonIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedAddons: CartAddon[] = useMemo(() => {
    return addons
      .filter(a => selectedAddonIds.has(a.id))
      .map(a => ({ id: a.id, name: a.name, price: a.price }));
  }, [addons, selectedAddonIds]);

  const selectedVariant: CartVariant | null = useMemo(() => {
    const v = variants.find(v => v.id === selectedVariantId) || null;
    return v ? { id: v.id, name: v.name, price: v.price } : null;
  }, [variants, selectedVariantId]);

  const totalAddonPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalPrice = product.price + totalAddonPrice + (selectedVariant?.price || 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Item Options" : "Add to Order"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{product.name}</h4>
              {product.description && (
                <p className="text-sm text-gray-600">{product.description}</p>
              )}
            </div>
            <div className="text-lg font-bold text-green-600">{format(product.price)}</div>
          </div>
        </div>

        {/* Add-ons */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Add Ons</h4>
          {addons.length === 0 ? (
            <p className="text-sm text-gray-500">No add-ons available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {addons.map((addon) => {
                const active = selectedAddonIds.has(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      active ? "bg-green-100 border-green-300 text-green-800" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {addon.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Variants */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Variants</h4>
          {variants.length === 0 ? (
            <p className="text-sm text-gray-500">No variants available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                const active = selectedVariantId === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(active ? null : variant.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      active ? "bg-blue-100 border-blue-300 text-blue-800" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {variant.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
          <div className="flex items-center justify-between">
            <span>Estimated Total</span>
            <span className="font-semibold text-green-700">{format(totalPrice)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200">Cancel</button>
          <button
            onClick={() => onConfirm(selectedAddons, selectedVariant)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            {isEditing ? "Update Item" : "Add to Order"}
          </button>
        </div>
      </div>
    </div>
  );
}


