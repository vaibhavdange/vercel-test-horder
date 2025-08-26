"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useStockItems } from "@/hooks/use-stock-items";

export interface ExtraFormRow {
  name: string;
  price: string; // keep as string in the form; convert when saving
  stockItemId?: string;
}

interface ExtrasEditorProps {
  extras: ExtraFormRow[];
  onChange: (extras: ExtraFormRow[]) => void;
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

export default function ExtrasEditor({ extras, onChange }: ExtrasEditorProps) {
  const setRow = (index: number, row: ExtraFormRow) => {
    const next = extras.map((r, i) => (i === index ? row : r));
    onChange(next);
  };

  const addRow = () => onChange([...extras, { name: "", price: "", stockItemId: undefined }]);

  const removeRow = (idx: number) => {
    const next = extras.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="block text-sm font-medium text-gray-900">Add Extra</span>
        <button type="button" onClick={addRow} className="text-green-600 hover:text-green-800" aria-label="Add extra">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 mt-2">
        {extras.map((row, idx) => (
          <ExtraRow
            key={idx}
            row={row}
            onRowChange={(updated) => setRow(idx, updated)}
            onRemove={() => removeRow(idx)}
          />
        ))}
      </div>
    </div>
  );
}

