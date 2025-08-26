"use client";

import { X, CreditCard } from "lucide-react";

interface OrderConfirmationMessageProps {
  isVisible: boolean;
  onClose: () => void;
  onPayNow: () => void;
}

export default function OrderConfirmationMessage({
  isVisible,
  onClose,
  onPayNow,
}: OrderConfirmationMessageProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1/3 md:h-1/4 min-h-[220px] bg-white border-t border-gray-200 p-4 animate-in slide-in-from-bottom duration-300">
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Confirmation message */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-green-600 mb-2">✓</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Order Successfully Placed</h3>
          <p className="text-sm text-gray-600">Your order has been sent to the kitchen</p>
        </div>
        
        {/* Pay Now button */}
        <button
          onClick={onPayNow}
          className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 shadow-lg mb-3"
        >
          <CreditCard className="h-4 w-4" />
          <span>Pay Now?</span>
        </button>
        
        {/* Create New Order button */}
        <button
          onClick={onClose}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Create New Order
        </button>
      </div>
    </div>
  );
}
