"use client";

import React, { useEffect, useMemo, useState } from "react";

interface MenuSearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  resultsCount?: number;
  activeCategoryName?: string;
  debounceMs?: number;
  className?: string;
}

function MenuSearchBarComponent({
  value = "",
  onChange,
  placeholder = "Search menu items",
  resultsCount,
  activeCategoryName,
  debounceMs = 300,
  className = "",
}: MenuSearchBarProps) {
  const [localValue, setLocalValue] = useState<string>(value);
  // Removed scroll-follow behavior; keep component simple and static

  // Keep local input in sync when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce notifying parent to avoid heavy re-renders while typing
  useEffect(() => {
    if (!onChange) return;
    const id = setTimeout(() => onChange(localValue), debounceMs);
    return () => clearTimeout(id);
  }, [localValue, onChange, debounceMs]);

  const showMeta = useMemo(() => localValue.trim().length > 0, [localValue]);

  // No scroll effects

  return (
    <div className={`sticky top-0 z-10 ${className}`}>
      <div className="py-3">
        <div className="relative">
          <input
            type="text"
            placeholder={placeholder}
            className="w-full sm:w-2/3 lg:w-1/2 px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            aria-label="Search menu items"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {localValue && (
            <button
              onClick={() => setLocalValue("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {showMeta && (
          <div className="mt-2 text-sm text-gray-600">
            {typeof resultsCount === "number" ? (
              <div className="flex items-center space-x-2">
                <span>
                  {resultsCount > 0
                    ? `Showing ${resultsCount} items matching "${localValue}"`
                    : `No items found matching "${localValue}"`}
                </span>
                {activeCategoryName && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    📍 {activeCategoryName}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

const MenuSearchBar = React.memo(MenuSearchBarComponent);
export default MenuSearchBar;


