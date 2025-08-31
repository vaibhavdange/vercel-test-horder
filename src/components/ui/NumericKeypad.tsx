"use client";

import React from "react";
import { X, Delete, Check } from "lucide-react";

interface NumericKeypadProps {
  open: boolean;
  title?: string;
  value: string;
  onChange: (nextValue: string) => void;
  onClose: () => void;
  onConfirm?: () => void;
  allowDecimal?: boolean;
  maxDecimalPlaces?: number;
  variant?: "overlay" | "inline";
  className?: string;
  entryMode?: "adding-machine" | "direct";
  disabled?: boolean;
}

function clampDecimalPlaces(input: string, maxDecimalPlaces: number): string {
  if (maxDecimalPlaces <= 0) return input.split(".")[0];
  const [whole, fraction] = input.split(".");
  if (fraction === undefined) return input;
  return `${whole}.${fraction.slice(0, maxDecimalPlaces)}`;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  open,
  title,
  value,
  onChange,
  onClose,
  onConfirm,
  allowDecimal = true,
  maxDecimalPlaces = 2,
  variant = "overlay",
  className,
  entryMode = "adding-machine",
  disabled = false,
}) => {
  if (!open) return null;

  const toCents = (display: string): number => {
    const trimmed = (display || "").toString().trim();
    if (trimmed.length === 0) return 0;
    const numeric = Number(trimmed.replace(/[^0-9.]/g, ""));
    if (Number.isNaN(numeric)) return 0;
    // If string contains a dot, treat as direct decimal amount
    if (trimmed.includes(".")) {
      return Math.round(numeric * 100);
    }
    // Otherwise assume it already represents a decimal number
    return Math.round(numeric * 100);
  };

  const centsToDisplay = (cents: number): string => {
    const sign = cents < 0 ? "-" : "";
    const abs = Math.abs(cents);
    const whole = Math.floor(abs / 100);
    const fraction = String(abs % 100).padStart(2, "0");
    return `${sign}${whole}.${fraction}`;
  };

  const handleAppend = (token: string) => {
    if (disabled) return;
    if (entryMode === "adding-machine") {
      let cents = toCents(value);
      if (token === "00") {
        cents = cents * 100;
        onChange(centsToDisplay(cents));
        return;
      }
      if (token === ".") {
        // In adding-machine mode, ignore explicit decimal dot
        return;
      }
      const digit = Number(token);
      if (!Number.isFinite(digit)) return;
      cents = cents * 10 + digit;
      onChange(centsToDisplay(cents));
      return;
    }

    // direct mode (append characters with optional decimal)
    if (token === "00") {
      const next = clampDecimalPlaces(value + "00", maxDecimalPlaces);
      if (!next.includes(".") && next.length > 1 && next.startsWith("0")) {
        onChange(String(parseInt(next, 10)));
      } else {
        onChange(next);
      }
      return;
    }
    if (token === ".") {
      if (!allowDecimal) return;
      if (value.includes(".")) return;
      onChange(value ? `${value}.` : "0.");
      return;
    }
    const next = clampDecimalPlaces(value + token, maxDecimalPlaces);
    if (!next.includes(".") && next.length > 1 && next.startsWith("0")) {
      onChange(String(parseInt(next, 10)));
    } else {
      onChange(next);
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    if (entryMode === "adding-machine") {
      let cents = toCents(value);
      cents = Math.floor(cents / 10);
      onChange(centsToDisplay(cents));
      return;
    }
    if (!value) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    if (entryMode === "adding-machine") {
      onChange(centsToDisplay(0));
    } else {
      onChange("");
    }
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  if (variant === "inline") {
    return (
      <div className={className}>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-3 gap-3">
            {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "00", "."].map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => handleAppend(token)}
                className="h-12 text-xl rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                {token}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              type="button"
              onClick={handleBackspace}
              className="h-10 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center"
            >
              <Delete className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              AC
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="text-base font-semibold text-gray-900">{title || "Enter Amount"}</div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="w-full mb-3 px-4 py-3 text-right text-2xl font-mono border border-gray-200 rounded-lg bg-gray-50">
            {value === "" ? "0" : value}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => handleAppend(token)}
                disabled={disabled}
                className={`h-14 text-xl rounded-lg transition-colors ${
                  disabled 
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed" 
                    : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
                }`}
              >
                {token}
              </button>
            ))}

            {/* Dot */}
            <button
              type="button"
              onClick={() => handleAppend(".")}
              disabled={!allowDecimal || disabled}
              className={`h-14 text-xl rounded-lg transition-colors ${
                disabled || !allowDecimal 
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed" 
                  : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              .
            </button>

            {/* 0 */}
            <button
              type="button"
              onClick={() => handleAppend("0")}
              disabled={disabled}
              className={`h-14 text-xl rounded-lg transition-colors ${
                disabled 
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed" 
                  : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              0
            </button>

            {/* Backspace */}
            <button
              type="button"
              onClick={handleBackspace}
              disabled={disabled}
              className={`h-14 rounded-lg transition-colors flex items-center justify-center ${
                disabled 
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed" 
                  : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className={`h-12 rounded-lg border transition-colors ${
                disabled 
                  ? "border-gray-200 text-gray-400 cursor-not-allowed" 
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={disabled}
              className={`h-12 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                disabled 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <Check className="h-5 w-5" />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumericKeypad;


