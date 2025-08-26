"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, DollarSign, QrCode, RotateCcw, Receipt, AlertCircle, CheckCircle } from "lucide-react";
import { Order, OrderItem } from "@/types/orders";
import { RefundMethod, RefundedItem } from "@/types/transaction";
import { useCurrency } from "@/hooks/useCurrency";

interface RefundDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onRefundComplete: (refundId: string) => void;
}

interface RefundMethodOption {
  id: RefundMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
}

export default function RefundDrawer({ isOpen, onClose, order, onRefundComplete }: RefundDrawerProps) {
  const [selectedRefundMethod, setSelectedRefundMethod] = useState<RefundMethod | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [refundReason, setRefundReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundStatus, setRefundStatus] = useState<"idle" | "processing" | "success">("idle");
  const [completedRefund, setCompletedRefund] = useState<any>(null);
  
  // Currency formatter
  const { format } = useCurrency();

  const refundMethods: RefundMethodOption[] = [
    {
      id: "cash",
      name: "Cash",
      icon: <DollarSign className="h-5 w-5" />,
      description: "Refund in cash",
      available: true,
    },
    {
      id: "card",
      name: "Card",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Refund to original card",
      available: true,
    },
    {
      id: "voucher",
      name: "Voucher",
      icon: <Receipt className="h-5 w-5" />,
      description: "Issue store voucher",
      available: true,
    },
    {
      id: "store_credit",
      name: "Store Credit",
      icon: <RotateCcw className="h-5 w-5" />,
      description: "Add to customer account",
      available: true,
    },
  ];

  // Calculate refund amounts
  const getSelectedItemsTotal = (): number => {
    if (selectedItems.size === 0) return 0;
    
    return order.orderItems.reduce((total, item) => {
      if (selectedItems.has(item.id)) {
        return total + (item.totalPrice || 0);
      }
      return total;
    }, 0);
  };

  const getRefundableAmount = (): number => {
    if (selectedItems.size === 0) return order.totalAmount;
    return getSelectedItemsTotal();
  };

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleRefundMethodSelect = (method: RefundMethod) => {
    setSelectedRefundMethod(method);
  };

  const processRefund = async () => {
    if (!selectedRefundMethod) return;

    setIsProcessing(true);
    setRefundStatus("processing");

    try {
      // Prepare refunded items data
      const refundedItems: RefundedItem[] = order.orderItems
        .filter(item => selectedItems.size === 0 || selectedItems.has(item.id))
        .map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          refundReason: refundReason || undefined,
        }));

      // Get transaction ID from order
      const transactionResponse = await fetch(`/api/transactions?orderId=${order.id}`);
      if (!transactionResponse.ok) {
        throw new Error("Failed to fetch transaction");
      }
      
      const transactions = await transactionResponse.json();
      if (!transactions || transactions.length === 0) {
        throw new Error("No transaction found for this order");
      }
      
      const transactionId = transactions[0].id;

      const refundData = {
        orderId: order.id,
        transactionId,
        refundAmount: getRefundableAmount(),
        refundReason: refundReason || undefined,
        refundMethod: selectedRefundMethod,
        refundedItems,
        notes: notes || undefined,
      };

      // Create refund via API
      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refundData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Refund API error:", errorText);
        throw new Error("Failed to process refund");
      }

      const refund = await response.json();
      console.log("Refund processed successfully:", refund);

      setRefundStatus("success");
      setCompletedRefund(refund);
      
      // Notify parent component
      onRefundComplete(refund.id);
    } catch (error) {
      console.error("Refund processing failed:", error);
      setRefundStatus("idle");
      // You might want to show an error toast here
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (refundStatus === "success") {
      onRefundComplete(completedRefund.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Process Refund</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg">
                Order Summary
              </h3>
              
              {/* Order Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">KOT #{order.kotNumber || 'N/A'}</span>
                  <span className="font-medium">{order.customerName || "Walk-in Customer"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Select Items to Refund */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Select Items to Refund</h3>
              <p className="text-sm text-gray-600">
                Click on items to select them for refund. Leave unselected to refund entire order.
              </p>
              
              <div className="space-y-2">
                {order.orderItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemToggle(item.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedItems.has(item.id)
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className={`font-medium ${
                          selectedItems.has(item.id) 
                            ? "text-red-700 line-through" 
                            : "text-gray-900"
                        }`}>
                          {item.quantity}x {item.productName}
                        </div>
                        {item.customizationNotes && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.customizationNotes}
                          </div>
                        )}
                      </div>
                      <div className={`font-mono text-lg ${
                        selectedItems.has(item.id) 
                          ? "text-red-700 line-through" 
                          : "text-gray-800"
                      }`}>
                        {format(item.totalPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refund Summary */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-800">{format(getRefundableAmount())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="text-gray-800">{format(0)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Refundable:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {format(getRefundableAmount())}
                  </span>
                </div>
              </div>
            </div>

            {/* Refund Reason */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Refund Reason</h3>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a reason</option>
                <option value="Customer not satisfied">Customer not satisfied</option>
                <option value="Wrong order">Wrong order</option>
                <option value="Quality issue">Quality issue</option>
                <option value="Service issue">Service issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Additional Notes */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Additional Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details about the refund..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>

            {/* Refund Method Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Select Refund Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {refundMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleRefundMethodSelect(method.id)}
                    disabled={!method.available || isProcessing}
                    className={`p-3 border rounded-lg text-center transition-all duration-200 flex flex-col items-center space-y-2 ${
                      selectedRefundMethod === method.id
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    } ${!method.available || isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedRefundMethod === method.id 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {method.icon}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm">{method.name}</div>
                      <div className="text-xs text-gray-500">{method.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Success Message */}
            {refundStatus === "success" && completedRefund && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Refund Processed Successfully!</span>
                </div>
                <div className="mt-2 text-sm text-green-700">
                  <div>Refund Number: {completedRefund.refundNumber}</div>
                  <div>Amount: {format(completedRefund.refundAmount)}</div>
                  <div>Method: {completedRefund.refundMethod}</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            {refundStatus === "success" ? (
              <button
                onClick={handleClose}
                className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
              >
                Close & Return to Orders
              </button>
            ) : (
              <button
                onClick={processRefund}
                disabled={isProcessing || !selectedRefundMethod}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                  isProcessing || !selectedRefundMethod
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {isProcessing ? "Processing Refund..." : "Process Refund"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
