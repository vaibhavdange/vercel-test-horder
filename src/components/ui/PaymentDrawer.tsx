"use client";

import { useState, useEffect, useCallback } from "react";
import { X, CreditCard, DollarSign, Receipt, RotateCcw, Gift, Split, Calculator, QrCode, Printer, Mail, Plus, Minus } from "lucide-react";
import { printBillFromOrder } from "@/lib/print/bill";
import { useCurrency } from "@/hooks/useCurrency";
import { NumericKeypad } from "./NumericKeypad";
import { OrderItem, Order } from "@/types/orders";

interface PaymentMethod {
  id: string;
  name: string;
  type: "cash" | "card" | "digital" | "gift_card" | "split";
  isActive: boolean;
  description?: string;
  icon: React.ReactNode;
}

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onPaymentComplete: (transaction: any, paymentDetails?: { method: string; cashReceived?: number; changeDue?: number }) => void;
}

interface SplitPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

interface CashButton {
  id: string;
  amount: number;
  label: string;
}

export default function PaymentDrawer({ isOpen, onClose, order, onPaymentComplete }: PaymentDrawerProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [isOrderSummaryCollapsed, setIsOrderSummaryCollapsed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle");
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState<string>("");
  const [partialPayment, setPartialPayment] = useState<boolean>(false);
  const [partialAmount, setPartialAmount] = useState<number>(order.totalAmount);
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<string | null>(null);
  const [customSplitInput, setCustomSplitInput] = useState<string>("");
  const [currentSplitIndex, setCurrentSplitIndex] = useState<number>(0);
  const [cashButtons, setCashButtons] = useState<CashButton[]>([
    { id: "1", amount: 100, label: "100" },
    { id: "2", amount: 50, label: "50" }
  ]);

  // Discount state
  const [isDiscountEnabled, setIsDiscountEnabled] = useState<boolean>(false);
  const [discountMode, setDiscountMode] = useState<"percent" | "amount">("percent");
  const [discountInput, setDiscountInput] = useState<string>("");
  const [selectedQuickDiscount, setSelectedQuickDiscount] = useState<string | null>(null);

  type KeypadTarget = "cash" | "partial" | "discount";
  const [isKeypadOpen, setIsKeypadOpen] = useState<boolean>(false);

  // Load cash button configuration from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('settings.cashButtons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCashButtons(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading cash button settings:', error);
    }
  }, []);

  // Listen for cash button configuration changes
  useEffect(() => {
    const handleCashButtonsChanged = (event: CustomEvent) => {
      setCashButtons(event.detail);
    };

    window.addEventListener('settings:cashButtonsChanged', handleCashButtonsChanged as EventListener);
    
    return () => {
      window.removeEventListener('settings:cashButtonsChanged', handleCashButtonsChanged as EventListener);
    };
  }, []);
  const [keypadTarget, setKeypadTarget] = useState<KeypadTarget | null>(null);

  // String inputs for keypad + keyboard editing
  const [cashInput, setCashInput] = useState<string>("");
  const [partialInput, setPartialInput] = useState<string>(order.totalAmount.toString());
  
  // Currency formatter
  const { format } = useCurrency();
  const getCurrencySymbol = (code: string): string => {
    try {
      const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(0);
      // Strip digits, punctuation and spaces, keep the symbol portion
      const symbol = formatted.replace(/[0-9.,\s]/g, "");
      return symbol || code;
    } catch {
      return code;
    }
  };

  // Clear split payments when toggle is turned off
  useEffect(() => {
    if (!isSplitPayment) {
      setSplitPayments([]);
      setCustomSplitInput("");
    }
  }, [isSplitPayment]);

  const setCashBoth = (next: string) => {
    setCashInput(next);
    const parsed = parseFloat(next);
    const amount = isNaN(parsed) ? 0 : parsed;
    setCashReceived(amount);
    // Format input to 2 decimal places if it's a valid number
    if (!isNaN(parsed)) {
      setCashInput(amount.toFixed(2));
    }
  };

  const setPartialBoth = (next: string) => {
    setPartialInput(next);
    const parsed = parseFloat(next);
    const bounded = Math.min(isNaN(parsed) ? 0 : parsed, finalTotal || 0);
    setPartialAmount(bounded);
    // Format input to 2 decimal places if it's a valid number
    if (!isNaN(parsed)) {
      setPartialInput(bounded.toFixed(2));
    }
  };

  const paymentMethods: PaymentMethod[] = [
    { id: "cash", name: "Cash", type: "cash", isActive: true, icon: <DollarSign className="h-5 w-5" /> },
    { id: "card", name: "Card", type: "card", isActive: true, icon: <CreditCard className="h-5 w-5" /> },
    { id: "qr", name: "QR", type: "digital", isActive: true, icon: <QrCode className="h-5 w-5" /> },
  ];

  // Calculate totals with discount (no tips currently)
  const totalWithServiceCharge = (order.totalAmount || 0) + (order.serviceChargeAmount || 0);
  const parsedDiscount = parseFloat(discountInput);
  const discountNumeric = Number.isFinite(parsedDiscount) ? parsedDiscount : 0;
  const calculatedDiscountAmount = isDiscountEnabled
    ? (discountMode === "percent"
        ? Math.min(100, Math.max(0, discountNumeric)) / 100 * totalWithServiceCharge
        : Math.min(Math.max(0, discountNumeric), totalWithServiceCharge))
    : 0;
  const finalTotal = Math.max(0, totalWithServiceCharge - calculatedDiscountAmount);
  const changeDue = Math.max(0, (cashReceived || 0) - (finalTotal || 0));
  const amountRemaining = Math.max(0, (finalTotal || 0) - (cashReceived || 0));
  const exactCashAmount = finalTotal;

  const orderSummaryTitle = (() => {
    const name = order.customerName || "Walk-in Customer";
    if (order.orderType === "dine-in" && (order.tableNumber && order.tableNumber !== "")) {
      return `${name} - Table ${order.tableNumber}`;
    }
    return name;
  })();

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  const handleExactCash = () => {
    setCashReceived(finalTotal || 0);
    setCashInput((finalTotal || 0).toFixed(2));
  };

  const openKeypad = (target: KeypadTarget) => {
    if (showReceipt) return;
    setKeypadTarget(target);
    setIsKeypadOpen(true);
  };

  const setDiscountBoth = (next: string) => {
    setDiscountInput(next);
    // When leaving as string; formatting on blur
  };

  const handleReprint = async () => {
    try {
      if (order) {
        const paymentDetails = {
          method: selectedPaymentMethod?.name || 'Unknown',
          cashReceived: selectedPaymentMethod?.type === 'cash' ? cashReceived : undefined,
          changeDue: selectedPaymentMethod?.type === 'cash' ? changeDue : undefined
        };
        await printBillFromOrder(order, true, paymentDetails);
      }
    } catch (e) {
      console.error('Reprint failed:', e);
    }
  };

  const handleEmailReceipt = () => {
    // TODO: Implement email receipt functionality
    console.log("Sending email receipt...");
  };

  // Parse extras from item customization notes (format: "Extras: Cheese (+$1.00), Bacon (+$2.00)")
  const parseExtrasFromNotes = (notes?: string): Array<{ name: string; price?: number }> => {
    if (!notes) return [];
    const parts = notes.split('|').map((p) => p.trim()).filter((p) => p.length > 0);
    const extrasPart = parts.find((p) => /^extras:\s*/i.test(p));
    if (!extrasPart) return [];
    const extrasText = extrasPart.replace(/^extras:\s*/i, '');
    if (!extrasText) return [];
    return extrasText.split(',').map((token) => {
      const trimmed = token.trim();
      // Support currencies like $, ₹, and others; capture the numeric part
      const priceMatch = trimmed.match(/\(\+\s*[^\d]*([0-9]+(?:\.[0-9]{1,2})?)\s*\)/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;
      const name = trimmed.replace(/\(\+\s*[^\d]*[0-9]+(?:\.[0-9]{1,2})?\s*\)/, '').trim();
      return { name, price };
    }).filter((e) => e.name.length > 0);
  };

  // Aggregate extras across items, multiplying by item quantity
  const getAggregatedExtras = (): Array<{ name: string; quantity: number; unitPrice?: number }> => {
    const map: Record<string, { name: string; quantity: number; unitPrice?: number }> = {};
    const sourceItems: OrderItem[] = (order.orderItems && order.orderItems.length > 0) ? order.orderItems : (((order as any).items || []) as OrderItem[]);
    sourceItems.forEach((item: OrderItem) => {
      const extras = parseExtrasFromNotes(item.customizationNotes);
      const itemQty = item.quantity || 1;
      extras.forEach((ex) => {
        const key = ex.name.toLowerCase();
        if (!map[key]) {
          map[key] = { name: ex.name, quantity: 0, unitPrice: ex.price };
        }
        map[key].quantity += itemQty;
        if (map[key].unitPrice === undefined && ex.price !== undefined) {
          map[key].unitPrice = ex.price;
        }
      });
    });
    return Object.values(map);
  };

  // Order items list with fallback to support both shapes
  const orderItemsList: OrderItem[] = (order.orderItems && order.orderItems.length > 0)
    ? order.orderItems
    : (((order as any).items || []) as OrderItem[]);

  const processPayment = async () => {
    if (!isSplitPayment && !selectedPaymentMethod) return;
    if (isSplitPayment) {
      if (splitPayments.length === 0) return;
      if (!selectedPaymentMethod) return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      console.log("Starting payment process...");
      console.log("Selected method:", selectedPaymentMethod);
      console.log("Is split payment:", isSplitPayment);
      console.log("Final total:", finalTotal);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Prepare transaction data
      const isSequentialSplit = isSplitPayment && splitPayments.length > 0;
      const amountForThisCharge = isSequentialSplit
        ? (splitPayments[currentSplitIndex]?.amount || 0)
        : (finalTotal || 0);
      const isLastSplit = isSequentialSplit
        ? currentSplitIndex === (splitPayments.length - 1)
        : true;
      const transactionData = {
        orderId: order.id,
        method: selectedPaymentMethod?.id || "split",
        amount: amountForThisCharge,
        customerId: order.customerId,
        partialPayment: isSequentialSplit ? !isLastSplit : partialPayment,
        partialAmount: isSequentialSplit ? amountForThisCharge : (partialPayment ? partialAmount : finalTotal),
        splitPayments: [],
        // Discount persistence
        discountAmount: calculatedDiscountAmount,
        discountMode: isDiscountEnabled ? discountMode : undefined,
        discountValue: isDiscountEnabled ? (discountNumeric || 0) : undefined,
        finalTotal: finalTotal,
      };

      console.log("Transaction data:", transactionData);

      // Create transaction record in backend
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      });

      console.log("Transaction API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Transaction API error:", errorText);
        throw new Error("Failed to create transaction");
      }

      const transaction = await response.json();
      console.log("Created transaction:", transaction);

      // Sequential split handling: advance until all splits are paid
      if (isSequentialSplit && !isLastSplit) {
        setPaymentStatus("idle");
        setIsProcessing(false);
        setSelectedPaymentMethod(null);
        setCurrentSplitIndex((prev) => prev + 1);
        return;
      } else {
        setPaymentStatus("success");
        setCompletedTransaction(transaction);
        setShowReceipt(true);
        
        console.log("Calling onPaymentComplete with transaction ID:", transaction.id);
        // Pass payment details for bill printing
        const paymentDetails = {
          method: selectedPaymentMethod?.name || 'Unknown',
          cashReceived: selectedPaymentMethod?.type === 'cash' ? cashReceived : undefined,
          changeDue: selectedPaymentMethod?.type === 'cash' ? changeDue : undefined
        };
        onPaymentComplete(transaction, paymentDetails);
        console.log("onPaymentComplete called successfully");
      }
    } catch (error) {
      console.error("Payment processing failed:", error);
      // Reset processing state on error
      setPaymentStatus("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  const addSplitPayment = (method: PaymentMethod) => {
    setSplitPayments([...splitPayments, { method, amount: 0 }]);
  };

  const updateSplitPayment = (index: number, field: keyof SplitPayment, value: any) => {
    const updated = [...splitPayments];
    updated[index] = { ...updated[index], [field]: value };
    setSplitPayments(updated);
  };

  const removeSplitPayment = (index: number) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const totalSplitAmount = splitPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const splitRemaining = (finalTotal || 0) - totalSplitAmount;



  // Helper for "Split N of X"
  const parsedCustomSplits = (() => {
    const n = parseInt(customSplitInput);
    return Number.isFinite(n) ? n : 0;
  })();
  const totalSplitsSelected = splitPayments.length > 0 ? splitPayments.length : (parsedCustomSplits >= 2 && parsedCustomSplits <= 10 ? parsedCustomSplits : 0);
  const currentSplitDisplay = totalSplitsSelected > 0 ? (splitPayments.length > 0 ? (currentSplitIndex + 1) : 1) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Process Payment</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Order Summary - collapsible details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-lg">{orderSummaryTitle}</h3>
                <button
                  onClick={() => setIsOrderSummaryCollapsed((v) => !v)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                  aria-label={isOrderSummaryCollapsed ? 'Expand order summary' : 'Collapse order summary'}
                >
                  {isOrderSummaryCollapsed ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                </button>
              </div>

              {!isOrderSummaryCollapsed && (
                <>
                  {/* Order Items */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Items Ordered:</h4>
                    <div className="space-y-1">
                      {orderItemsList.map((item: OrderItem, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="font-mono text-gray-600">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="font-mono text-gray-800">
                            {Intl.NumberFormat('en-US', { style: 'currency', currency: (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('settings.general') || '{}')?.currency) || 'INR' }).format(((item.quantity || 0) * (item.unitPrice || 0)))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extras */}
                  {(() => {
                    const extras = getAggregatedExtras();
                    if (extras.length === 0) return null;
                    return (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Extras:</h4>
                        <div className="space-y-1">
                          {extras.map((ex, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="font-mono text-gray-600">
                                {ex.quantity}x {ex.name}
                              </span>
                              <span className="font-mono text-gray-800">
                                {Intl.NumberFormat('en-US', { style: 'currency', currency: (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('settings.general') || '{}')?.currency) || 'INR' }).format(ex.unitPrice ? ex.unitPrice * ex.quantity : 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Order Details with lighter dividers */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">KOT #{order.kotNumber || 'N/A'}</span>
                      <span className="font-medium">{order.customerName || "Walk-in Customer"}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-gray-800">{Intl.NumberFormat('en-US', { style: 'currency', currency: (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('settings.general') || '{}')?.currency) || 'INR' }).format(order.subtotal || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span className="text-gray-800">{Intl.NumberFormat('en-US', { style: 'currency', currency: (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('settings.general') || '{}')?.currency) || 'INR' }).format(order.taxAmount || 0)}</span>
                      </div>
                      {(order.serviceChargeAmount || 0) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service Charge:</span>
                          <span className="text-orange-600">+{Intl.NumberFormat('en-US', { style: 'currency', currency: (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('settings.general') || '{}')?.currency) || 'INR' }).format(order.serviceChargeAmount || 0)}</span>
                        </div>
                      )}
                      {(isDiscountEnabled ? calculatedDiscountAmount : (order.discountAmount || 0)) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Discount:</span>
                          <span className="text-green-600">-{Intl.NumberFormat('en-US', { style: 'currency', currency: (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('settings.general') || '{}')?.currency) || 'INR' }).format(isDiscountEnabled ? calculatedDiscountAmount : (order.discountAmount || 0))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Total Payable - always visible */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Payable:</span>
                  <span className="text-3xl font-bold text-green-600">
                    {Intl.NumberFormat('en-US', { style: 'currency', currency: (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('settings.general') || '{}')?.currency) || 'INR' }).format(finalTotal || 0)}
                  </span>
                </div>

                {/* Split Payment Toggle - Inline */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Split Payment</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSplitPayment}
                      onChange={(e) => setIsSplitPayment(e.target.checked)}
                      disabled={showReceipt}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      showReceipt ? "opacity-50 cursor-not-allowed bg-gray-200" : "bg-gray-200 peer-checked:bg-green-600"
                    }`}></div>
                  </label>
                </div>

                {/* Split Payment Options - Buttons and Custom Input */}
                {isSplitPayment && (
                  <div className="mt-3 space-y-3">
                    {/* Split Payment Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[2, 3, 4].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            const splitAmount = (finalTotal || 0) / num;
                            setSplitPayments(Array(num).fill(null).map((_, index) => ({
                              method: paymentMethods[0],
                              amount: splitAmount,
                              reference: `Split ${index + 1}`
                            })));
                            setCustomSplitInput("");
                            setCurrentSplitIndex(0);
                            setSelectedPaymentMethod(null);
                          }}
                          disabled={showReceipt}
                          className={`py-2 px-3 rounded-lg transition-colors duration-200 ${
                            splitPayments.length === num
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          <span className="text-sm font-medium">{num}</span>
                        </button>
                      ))}
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={customSplitInput}
                        placeholder="Custom"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-center"
                        onChange={(e) => {
                          setCustomSplitInput(e.target.value);
                        }}
                        disabled={showReceipt}
                      />
                    </div>

                    {/* Helper + Split Action Row */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {currentSplitDisplay > 0 && totalSplitsSelected > 0 && (
                          <span>{`Split ${currentSplitDisplay} of ${totalSplitsSelected}`}</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const value = parseInt(customSplitInput);
                          if (value >= 2 && value <= 10) {
                            const splitAmount = (finalTotal || 0) / value;
                            setSplitPayments(Array(value).fill(null).map((_, index) => ({
                              method: paymentMethods[0],
                              amount: splitAmount,
                              reference: `Split ${index + 1}`
                            })));
                            setCustomSplitInput("");
                            setCurrentSplitIndex(0);
                            setSelectedPaymentMethod(null);
                          }
                        }}
                        disabled={showReceipt || !customSplitInput || parseInt(customSplitInput) < 2 || parseInt(customSplitInput) > 10}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Split
                      </button>
                    </div>
                  </div>
                )}

                {/* Partial Payment Toggle - Inline */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Partial Payment</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={partialPayment}
                      onChange={(e) => setPartialPayment(e.target.checked)}
                      disabled={showReceipt}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      showReceipt ? "opacity-50 cursor-not-allowed bg-gray-200" : "bg-gray-200 peer-checked:bg-green-600"
                    }`}></div>
                  </label>
                </div>

                {/* Discount Toggle */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Discount</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDiscountEnabled}
                      onChange={(e) => setIsDiscountEnabled(e.target.checked)}
                      disabled={showReceipt}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      showReceipt ? "opacity-50 cursor-not-allowed bg-gray-200" : "bg-gray-200 peer-checked:bg-green-600"
                    }`}></div>
                  </label>
                </div>

                {isDiscountEnabled && (
                  <div className="mt-3 space-y-3">
                    {/* Mode switch */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Mode</div>
                      <div className="flex items-center bg-gray-100 rounded-full p-1">
                        <button
                          className={`px-3 py-1 text-sm rounded-full ${discountMode === 'percent' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
                          onClick={() => { setDiscountMode('percent'); setSelectedQuickDiscount(null); }}
                          disabled={showReceipt}
                        >%
                        </button>
                        <button
                          className={`ml-1 px-3 py-1 text-sm rounded-full ${discountMode === 'amount' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
                          onClick={() => { setDiscountMode('amount'); setSelectedQuickDiscount(null); }}
                          disabled={showReceipt}
                        >{getCurrencySymbol((typeof window !== 'undefined' && JSON.parse(localStorage.getItem('settings.general') || '{}')?.currency) || 'INR')}
                        </button>
                      </div>
                    </div>

                    {/* Quick buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 15].map((v) => (
                        <button
                          key={v}
                          onClick={() => {
                            setDiscountBoth(String(v));
                            setSelectedQuickDiscount(`${v}`);
                          }}
                          disabled={showReceipt}
                          className={`py-2 px-3 rounded-lg transition-colors duration-200 ${
                            selectedQuickDiscount === `${v}`
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          <span className="text-sm font-medium">{v}{discountMode === 'percent' ? '%' : ''}</span>
                        </button>
                      ))}
                      <input
                        type="text"
                        value={discountInput}
                        placeholder={discountMode === 'percent' ? '0' : '0.00'}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setDiscountBoth(value);
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            const normalized = discountMode === 'percent' ? Math.min(100, Math.max(0, value)).toString() : value.toFixed(2);
                            setDiscountBoth(normalized);
                          }
                        }}
                        onFocus={() => openKeypad('discount')}
                        onClick={() => openKeypad('discount')}
                        disabled={showReceipt}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-right"
                      />
                    </div>

                    {/* Inline Keypad for Discount */}
                    <NumericKeypad
                      open={isKeypadOpen && keypadTarget === 'discount'}
                      value={discountInput}
                      onChange={(next) => setDiscountBoth(next)}
                      onClose={() => setIsKeypadOpen(false)}
                      allowDecimal={true}
                      maxDecimalPlaces={discountMode === 'percent' ? 0 : 2}
                      variant="inline"
                      entryMode="adding-machine"
                      className="mt-3"
                    />
                  </div>
                )}
              </div>
            </div>



            {/* Split Payment Inputs */}
            {isSplitPayment && (
              <div className="space-y-4">
                {/* Payment Method Selection for Split */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">
                    {splitPayments.length > 0 ? `Select Payment Method for Split ${currentSplitIndex + 1}:` : 'Select Payment Method:'}
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => {
                          handlePaymentMethodSelect(method);
                          if (splitPayments.length > 0) {
                            updateSplitPayment(currentSplitIndex, 'method', method.id);
                          }
                        }}
                        disabled={!method.isActive || showReceipt}
                        className={`p-3 border rounded-lg text-center transition-all duration-200 flex flex-col items-center space-y-2 ${
                          selectedPaymentMethod?.id === method.id
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        } ${!method.isActive || showReceipt ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className={`p-2 rounded-lg ${selectedPaymentMethod?.id === method.id ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                          {method.icon}
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-sm">{method.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {(selectedPaymentMethod?.type === "card" || selectedPaymentMethod?.type === "digital") && !showReceipt && (
                    <p className="text-sm text-gray-600 mt-2">
                      Please complete the payment on external terminal and press confirm
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Payment Method Selection - Enhanced with better colors and layout */}
            {!isSplitPayment && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Select Payment Method</h3>
                <div className="grid grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handlePaymentMethodSelect(method)}
                      disabled={!method.isActive || showReceipt}
                      className={`p-3 border rounded-lg text-center transition-all duration-200 flex flex-col items-center space-y-2 ${
                        selectedPaymentMethod?.id === method.id
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      } ${!method.isActive || showReceipt ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className={`p-2 rounded-lg ${
                        selectedPaymentMethod?.id === method.id
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {method.icon}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm">{method.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
                                 {(selectedPaymentMethod?.type === "card" || selectedPaymentMethod?.type === "digital") && !showReceipt && (
                  <p className="text-sm text-gray-600 mt-2">
                    Please complete the payment on external terminal and press confirm
                  </p>
                )}
              </div>
            )}

            {/* Cash Payment Input - Enhanced */}
            {selectedPaymentMethod?.type === "cash" && !isSplitPayment && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Cash Payment</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Received
                    </label>
                    <input
                      type="text"
                      value={cashInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setCashBoth(value);
                        }
                      }}
                      onBlur={(e) => {
                        // Format to 2 decimal places when input loses focus
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setCashBoth(value.toFixed(2));
                        }
                      }}
                      onFocus={() => openKeypad("cash")}
                      onClick={() => openKeypad("cash")}
                      disabled={showReceipt}
                      placeholder="0.00"
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-right ${
                        showReceipt ? "opacity-50 cursor-not-allowed bg-gray-100" : ""
                      }`}
                    />
                  </div>
                  
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        handleExactCash();
                        setSelectedQuickAmount("exact");
                        setCashBoth(String(finalTotal || 0));
                      }}
                      disabled={showReceipt}
                      className={`py-2 px-3 rounded-lg transition-colors duration-200 ${
                        selectedQuickAmount === "exact"
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-sm font-medium">Exact Cash</span>
                    </button>
                    {cashButtons.slice(0, 2).map((button) => (
                      <button
                        key={button.id}
                        onClick={() => {
                          setCashReceived(button.amount);
                          setCashInput(button.amount.toFixed(2));
                          setSelectedQuickAmount(`button-${button.id}`);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        disabled={showReceipt}
                        className={`py-2 px-3 rounded-lg transition-colors duration-200 ${
                          selectedQuickAmount === `button-${button.id}`
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        <span className="text-sm font-medium">{button.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Inline Keypad for Cash */}
                  <NumericKeypad
                    open={isKeypadOpen && keypadTarget === "cash"}
                    value={cashInput}
                    onChange={(next) => setCashBoth(next)}
                    onClose={() => setIsKeypadOpen(false)}
                    allowDecimal={true}
                    maxDecimalPlaces={2}
                    variant="inline"
                    entryMode="adding-machine"
                    className="mt-3"
                  />

                  {cashReceived > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{cashReceived >= (finalTotal || 0) ? "Change Due:" : "Remaining:"}</span>
                      <span className="font-semibold text-gray-800">{format((cashReceived >= (finalTotal || 0) ? (changeDue || 0) : (amountRemaining || 0)))}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gift Card Input */}
            {selectedPaymentMethod?.type === "gift_card" && !isSplitPayment && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Gift Card / Voucher</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value)}
                    disabled={showReceipt}
                    placeholder="Enter gift card code"
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      showReceipt ? "opacity-50 cursor-not-allowed bg-gray-100" : ""
                    }`}
                  />
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      Available Balance: {format(500)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Partial Payment Option */}
            {partialPayment && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partial Amount
                </label>
                <input
                  type="text"
                  value={partialInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setPartialBoth(value);
                    }
                  }}
                  onBlur={(e) => {
                    // Format to 2 decimal places when input loses focus
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      setPartialBoth(value.toFixed(2));
                    }
                  }}
                  onFocus={() => openKeypad("partial")}
                  onClick={() => openKeypad("partial")}
                  disabled={showReceipt}
                  max={finalTotal || 0}
                  className={`w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-right ${
                    showReceipt ? "opacity-50 cursor-not-allowed bg-gray-100" : ""
                  }`}
                />
                {/* Inline Keypad for Partial */}
                <NumericKeypad
                  open={isKeypadOpen && keypadTarget === "partial"}
                  value={partialInput}
                  onChange={(next) => setPartialBoth(next)}
                  onClose={() => setIsKeypadOpen(false)}
                  allowDecimal={true}
                  maxDecimalPlaces={2}
                  variant="inline"
                  entryMode="adding-machine"
                  className="mt-3"
                />
                <p className="text-xs text-green-600 mt-1">
                  Remaining: {format(((finalTotal || 0) - (partialAmount || 0)))}
                </p>
              </div>
            )}

            {/* Receipt Display with Actions */}
            {showReceipt && completedTransaction && (
              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Payment Receipt</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium">{completedTransaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">{completedTransaction.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{completedTransaction.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{format(completedTransaction?.totalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">Paid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{completedTransaction?.createdAt ? new Date(completedTransaction.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                
                {/* Receipt Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={handleReprint}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Reprint</span>
                  </button>
                  <button
                    onClick={handleEmailReceipt}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            {showReceipt ? (
              <button
                onClick={onClose}
                className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
              >
                Close & Return to Orders
              </button>
            ) : (
              <button
                onClick={processPayment}
                disabled={
                  isProcessing ||
                  (!isSplitPayment && !selectedPaymentMethod) ||
                  (isSplitPayment && (splitPayments.length === 0 || selectedPaymentMethod === null))
                }
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                  isProcessing 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : showReceipt
                    ? "bg-green-600 text-white cursor-not-allowed"
                    : (!isSplitPayment && !selectedPaymentMethod) || (isSplitPayment && (splitPayments.length === 0 || selectedPaymentMethod === null))
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isProcessing
                  ? "Processing..."
                  : showReceipt
                  ? "Payment Completed"
                  : isSplitPayment && splitPayments.length > 0
                  ? `Paying ${format(splitPayments[currentSplitIndex]?.amount || 0)} Split ${currentSplitIndex + 1} of ${splitPayments.length}`
                  : "Confirm"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
