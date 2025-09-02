"use client";

import { useState } from "react";
import { X, Plus, Edit, Trash2 } from "lucide-react";
import { useStockItems } from "@/hooks/use-stock-items";
import { useProductVariants, useCreateProductVariant, useUpdateProductVariant, useDeleteProductVariant } from "@/hooks/use-product-variants";

export interface ExtraFormRow {
  name: string;
  price: string; // keep as string in the form; convert when saving
  stockItemId?: string;
}

export interface VariantFormRow {
  id?: string;
  name: string;
  price: string;
  isNew?: boolean;
}

interface AddonsVariantsEditorProps {
  productId?: string;
  extras: ExtraFormRow[];
  variants: VariantFormRow[];
  onExtrasChange: (extras: ExtraFormRow[]) => void;
  onVariantsChange: (variants: VariantFormRow[]) => void;
}

function ExtraRow({
  row,
  onRowChange,
  onRemove,
}: {
  row: ExtraFormRow;
  onRowChange: (row: ExtraFormRow) => void;
  onRemove: () => void;
}) {
  const [query, setQuery] = useState(row.name);
  const { data: suggestions = [] } = useStockItems({ search: query });

  return (
    <div className="grid grid-cols-5 gap-2 items-start">
      <div className="col-span-3">
        <input
          type="text"
          placeholder="Search ingredient"
          value={row.name}
          onChange={(e) => {
            const name = e.target.value;
            onRowChange({ ...row, name, stockItemId: undefined });
            setQuery(name);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        {query && suggestions.length > 0 && (
          <div className="mt-1 max-h-32 overflow-auto border border-gray-200 rounded-md bg-white shadow-soft">
            {suggestions.slice(0, 6).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onRowChange({ ...row, name: s.name, stockItemId: s.id });
                  setQuery(s.name);
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Price"
          value={row.price}
          onChange={(e) => onRowChange({ ...row, price: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-500 hover:text-red-700"
          aria-label="Remove extra"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function VariantRow({
  row,
  onRowChange,
  onRemove,
  onSave,
}: {
  row: VariantFormRow;
  onRowChange: (row: VariantFormRow) => void;
  onRemove: () => void;
  onSave?: (row: VariantFormRow) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 items-start">
      <div className="col-span-3">
        <input
          type="text"
          placeholder="Variant name (e.g., 30ml, 60ml)"
          value={row.name}
          onChange={(e) => onRowChange({ ...row, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Extra price"
          value={row.price}
          onChange={(e) => onRowChange({ ...row, price: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex items-center justify-end space-x-1">
        {row.isNew && onSave && row.name && row.price && (
          <button
            type="button"
            onClick={() => onSave(row)}
            className="p-2 text-green-600 hover:text-green-700"
            aria-label="Save variant"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-500 hover:text-red-700"
          aria-label="Remove variant"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function AddonsVariantsEditor({ 
  productId, 
  extras, 
  variants, 
  onExtrasChange, 
  onVariantsChange 
}: AddonsVariantsEditorProps) {
  const [activeTab, setActiveTab] = useState<'addons' | 'variants'>('addons');
  const createVariant = useCreateProductVariant();
  const updateVariant = useUpdateProductVariant();
  const deleteVariant = useDeleteProductVariant();

  const setExtraRow = (index: number, row: ExtraFormRow) => {
    const next = extras.map((r, i) => (i === index ? row : r));
    onExtrasChange(next);
  };

  const addExtraRow = () => onExtrasChange([...extras, { name: "", price: "", stockItemId: undefined }]);

  const removeExtraRow = (idx: number) => {
    const next = extras.filter((_, i) => i !== idx);
    onExtrasChange(next);
  };

  const setVariantRow = async (index: number, row: VariantFormRow) => {
    const next = variants.map((r, i) => (i === index ? row : r));
    onVariantsChange(next);

    // If this is an existing variant (has ID), update it via API
    if (row.id && !row.isNew && productId) {
      try {
        await updateVariant.mutateAsync({
          productId,
          variantId: row.id,
          variantData: {
            name: row.name,
            price: parseFloat(row.price) || 0,
            isActive: true
          }
        });
      } catch (error) {
        console.error('Failed to update variant:', error);
        // Revert the change on error
        const reverted = variants.map((r, i) => (i === index ? variants[index] : r));
        onVariantsChange(reverted);
      }
    }
  };

  const addVariantRow = () => onVariantsChange([...variants, { name: "", price: "", isNew: true }]);

  const removeVariantRow = async (idx: number) => {
    const variantToRemove = variants[idx];
    
    // If this is an existing variant (has ID), delete it via API
    if (variantToRemove.id && !variantToRemove.isNew && productId) {
      try {
        await deleteVariant.mutateAsync({
          productId,
          variantId: variantToRemove.id
        });
      } catch (error) {
        console.error('Failed to delete variant:', error);
        return; // Don't remove from UI if API call failed
      }
    }
    
    // Remove from UI
    const next = variants.filter((_, i) => i !== idx);
    onVariantsChange(next);
  };

  const saveNewVariant = async (variant: VariantFormRow) => {
    if (!productId || !variant.name || !variant.price) return;

    try {
      const newVariant = await createVariant.mutateAsync({
        productId,
        variantData: {
          name: variant.name,
          price: parseFloat(variant.price) || 0
        }
      });

      // Update the variant in the list with the new ID
      const updatedVariants = variants.map(v => 
        v === variant ? { ...newVariant, isNew: false } : v
      );
      onVariantsChange(updatedVariants);
    } catch (error) {
      console.error('Failed to create variant:', error);
    }
  };

  return (
    <div className="col-span-2">
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Add-ons & Variants</h3>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('addons')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'addons'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Add-ons
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'variants'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Variants
          </button>
        </div>

        {/* Add-ons Tab */}
        {activeTab === 'addons' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Extra ingredients (e.g., Extra Cheese, Extra Patty)</span>
              <button 
                type="button" 
                onClick={addExtraRow} 
                className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                aria-label="Add extra"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add</span>
              </button>
            </div>

            <div className="space-y-2">
              {extras.map((row, idx) => (
                <ExtraRow
                  key={idx}
                  row={row}
                  onRowChange={(updated) => setExtraRow(idx, updated)}
                  onRemove={() => removeExtraRow(idx)}
                />
              ))}
              {extras.length === 0 && (
                <p className="text-sm text-gray-500 italic">No add-ons configured</p>
              )}
            </div>
          </div>
        )}

        {/* Variants Tab */}
        {activeTab === 'variants' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Product variants (e.g., 30ml, 60ml for alcohol)</span>
              <button 
                type="button" 
                onClick={addVariantRow} 
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                aria-label="Add variant"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add</span>
              </button>
            </div>

            <div className="space-y-2">
              {variants.map((row, idx) => (
                <VariantRow
                  key={row.id || idx}
                  row={row}
                  onRowChange={(updated) => setVariantRow(idx, updated)}
                  onRemove={() => removeVariantRow(idx)}
                  onSave={row.isNew ? saveNewVariant : undefined}
                />
              ))}
              {variants.length === 0 && (
                <p className="text-sm text-gray-500 italic">No variants configured</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
