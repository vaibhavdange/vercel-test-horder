"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Trash2, CheckCircle, Clock, AlertCircle, CreditCard, Loader2, ShoppingCart, PlusCircle, X, Truck, Users, Printer, RotateCcw, Calendar } from "lucide-react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { OrderFilters } from "@/types/orders";
import KitchenTimer from "@/components/ui/KitchenTimer";
import PaymentDrawer from "@/components/ui/PaymentDrawer";
import { printBillFromOrderAuto } from "@/lib/print/bill";
import RefundDrawer from "@/components/ui/RefundDrawer";
import { Order } from "@/types/orders";
import { formatKOTNumber } from "@/lib/utils";
import { parseSupabaseTimestamp } from "@/lib/time";
import { useCurrency } from '@/hooks/useCurrency';
import { useQueryClient } from "@tanstack/react-query";



// Toast notification component
const Toast = ({ message, type, isVisible, onClose }: { message: string; type: 'success' | 'error'; isVisible: boolean; onClose: () => void }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`p-4 rounded-lg shadow-lg max-w-sm ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        <div className="flex items-center space-x-2">
          {type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default function OrdersPage() {
  const { format } = useCurrency();
  // Real-time updates are now handled by the dashboard layout
  const [activeStatus, setActiveStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [isRefundDrawerOpen, setIsRefundDrawerOpen] = useState(false);
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean } | null>(null);
  const [showOnlyToday, setShowOnlyToday] = useState(true); // Default to showing only today's orders
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [isCustomDateActive, setIsCustomDateActive] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const statusOptions = ["All", "Takeaway", "Queued", "Cooking", "Service", "completed", "cancelled", "Paid", "Unpaid", "Refunded"];

  // Get today's date range for filtering
  const getTodayDateRange = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    return { startOfDay, endOfDay };
  };

  // Check if an order is from today
  const isOrderFromToday = (order: Order) => {
    const { startOfDay, endOfDay } = getTodayDateRange();
    const orderDate = parseSupabaseTimestamp(order.createdAt);
    return orderDate >= startOfDay && orderDate <= endOfDay;
  };

  // Check if an order is from a specific date
  const isOrderFromDate = (order: Order, date: Date) => {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    const orderDate = parseSupabaseTimestamp(order.createdAt);
    return orderDate >= startOfDay && orderDate <= endOfDay;
  };

  // Get the date range for API calls
  const getSelectedDateRange = () => {
    if (isCustomDateActive && customDate) {
      const startOfDay = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate());
      const endOfDay = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate(), 23, 59, 59, 999);
      return {
        dateFrom: startOfDay.toISOString(),
        dateTo: endOfDay.toISOString()
      };
    }
    if (showOnlyToday) {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      return {
        dateFrom: startOfDay.toISOString(),
        dateTo: endOfDay.toISOString()
      };
    }
    return { dateFrom: undefined, dateTo: undefined };
  };

  // Handle custom date selection
  const handleCustomDateSelect = (date: Date | null) => {
    setCustomDate(date);
    if (date) {
      setIsCustomDateActive(true);
      setShowOnlyToday(false);
    } else {
      setIsCustomDateActive(false);
      setShowOnlyToday(true);
    }
  };

  // Clear custom date and return to today's view
  const clearCustomDate = () => {
    setCustomDate(null);
    setIsCustomDateActive(false);
    setShowOnlyToday(true);
  };

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch orders from database using debounced search and date filtering
  const dateRange = getSelectedDateRange();
  
  const { data: ordersData, isLoading, error } = useOrders({
    status: activeStatus === "All" ? undefined : 
            activeStatus === "Takeaway" ? undefined : // We'll filter takeaway and payment statuses on the frontend
            activeStatus === "Paid" ? undefined :
            activeStatus === "Unpaid" ? undefined :
            activeStatus === "Refunded" ? undefined :
            activeStatus === "Queued" ? "pending" :
            activeStatus === "Cooking" ? "in-process" :
            activeStatus === "Service" ? "ready" : 
            activeStatus === "completed" ? "completed" : // Fix: explicitly map completed status
            activeStatus === "cancelled" ? "cancelled" : // Fix: explicitly map cancelled status
            activeStatus,
    search: debouncedSearchQuery || undefined,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
  });

  // Ensure orders is always an array and each order has orderItems
  const orders = (ordersData || []).map(order => ({
    ...order,
    orderItems: order.orderItems || []
  }));

  // Filter orders based on active status (backend handles date filtering)
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    // Apply status filters (backend handles date filtering)
    if (activeStatus === "All") {
      filtered = filtered.filter(order => order.status !== "completed" && order.status !== "cancelled");
    } else if (activeStatus === "Takeaway") {
      filtered = filtered.filter(order => order.orderType === "takeaway");
    } else if (activeStatus === "Paid") {
      filtered = filtered.filter(order => order.paymentStatus === "paid");
    } else if (activeStatus === "Unpaid") {
      filtered = filtered.filter(order => order.paymentStatus === "pending");
    } else if (activeStatus === "Refunded") {
      filtered = filtered.filter(order => order.paymentStatus === "refunded");
    } else if (activeStatus === "cancelled") {
      filtered = filtered.filter(order => order.status === "cancelled");
    }
    
    return filtered;
  }, [orders, activeStatus]);

  const updateOrderStatus = useUpdateOrderStatus();
  // Read ?order=<orderId> from URL and highlight/scroll to it
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const orderIdParam = params.get('order');
      if (orderIdParam) {
        setHighlightOrderId(orderIdParam);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (highlightOrderId && orders.length > 0) {
      const el = document.getElementById(`order-card-${highlightOrderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const timeout = setTimeout(() => setHighlightOrderId(null), 4000);
        return () => clearTimeout(timeout);
      }
    }
  }, [highlightOrderId, orders]);


  // Check if search is in progress (when searchQuery differs from debouncedSearchQuery)
  const isSearching = searchQuery !== debouncedSearchQuery;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in-process":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "text-green-600";
      case "in-process":
        return "text-orange-600";
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatStatusLabel = (value: string) => {
    if (value === "completed") return "Completed";
    if (value === "cancelled") return "Cancelled";
    return value;
  };

  const getSubStatusColor = (subStatus: string) => {
    if (subStatus?.includes("Ready")) return "bg-green-500";
    if (subStatus?.includes("Cooking")) return "bg-orange-500";
    if (subStatus?.includes("Kitchen")) return "bg-red-500";
    if (subStatus?.includes("Created")) return "bg-blue-500";
    return "bg-gray-500";
  };

  const formatDate = (dateString: string) => {
    const date = parseSupabaseTimestamp(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString: string) => {
    const date = parseSupabaseTimestamp(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Remove extra item prices from notes for KOT display while preserving other notes
  const formatNotesForKOT = (notes?: string): string => {
    if (!notes || notes.trim().length === 0) return '-';
    // Split notes by "|" to isolate the Extras segment if present
    const parts = notes.split('|').map((p) => p.trim()).filter((p) => p.length > 0);
    const extrasIndex = parts.findIndex((p) => p.toLowerCase().startsWith('extras:'));
    if (extrasIndex === -1) {
      return parts.join(' | ') || '-';
    }
    const baseParts = parts.slice(0, extrasIndex);
    const extrasPart = parts[extrasIndex].replace(/^extras:\s*/i, '');
    // Strip amounts like (+$1.00) or other currency symbols from the Extras list
    const cleanedExtras = extrasPart
      .replace(/\(\+[\p{Sc}]?[0-9]+(?:\.[0-9]{2})?\)/gu, '')
      .replace(/\s*,\s*/g, ', ')
      .trim();
    const finalParts = [...baseParts];
    if (cleanedExtras.length > 0) {
      finalParts.push(`Extras: ${cleanedExtras}`);
    }
    return finalParts.join(' | ') || '-';
  };

  const handleStatusUpdate = async (orderId: string, newStatus: "pending" | "in-process" | "ready" | "completed" | "cancelled" | "out-for-delivery" | "delivered", newSubStatus?: string) => {
    try {
      await updateOrderStatus.mutateAsync({
        orderId,
        status: newStatus,
        subStatus: newSubStatus,
      });
    } catch (error) {
      alert("Failed to update order status");
    }
  };

  // Function to determine the next status and button properties
  const getNextStatusInfo = (currentStatus: string): {
    nextStatus: "pending" | "in-process" | "ready" | "completed" | "cancelled" | "out-for-delivery" | "delivered";
    subStatus: string;
    buttonText: string;
    buttonColor: string;
    icon: React.ReactNode;
    disabled: boolean;
  } => {
    switch (currentStatus) {
      case "pending":
        return {
          nextStatus: "in-process",
          subStatus: "Cooking Now",
          buttonText: "Mark as Cooking",
          buttonColor: "bg-orange-600 hover:bg-orange-700",
          icon: <Clock className="h-4 w-4" />,
          disabled: false
        };
      case "in-process":
        return {
          nextStatus: "ready",
          subStatus: "Ready to Serve",
          buttonText: "Mark as Ready",
          buttonColor: "bg-green-600 hover:bg-green-700",
          icon: <CheckCircle className="h-4 w-4" />,
          disabled: false
        };
      case "ready":
        return {
          nextStatus: "completed",
          subStatus: "Order Completed",
          buttonText: "Mark as Completed",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
          icon: <CheckCircle className="h-4 w-4" />,
          disabled: false
        };
      default:
        return {
          nextStatus: "pending" as const,
          subStatus: "",
          buttonText: "Update Status",
          buttonColor: "bg-gray-600 hover:bg-gray-700",
          icon: <Clock className="h-4 w-4" />,
          disabled: true
        };
    }
  };

  // Function to check if order has been amended
  const isOrderAmended = (order: Order) => {
    return order.subStatus?.includes("Order Amended") || false;
  };

  const handleProgressiveStatusUpdate = async (order: any) => {
    const statusInfo = getNextStatusInfo(order.status);
    if (!statusInfo.disabled) {
      // Preserve amendment status if it exists
      let newSubStatus = statusInfo.subStatus;
      if (order.subStatus === "Order Amended") {
        newSubStatus = `Order Amended • ${statusInfo.subStatus}`;
      }
      
      await handleStatusUpdate(order.id, statusInfo.nextStatus, newSubStatus);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm("Cancel this order? It will move to cancelled and stock will be restored.")) {
      try {
        await updateOrderStatus.mutateAsync({ orderId, status: "cancelled", subStatus: "Order cancelled" });
      } catch (error) {
        alert("Failed to cancel order");
      }
    }
  };

  const handlePayment = (order: Order) => {
    setSelectedOrderForPayment(order);
    setIsPaymentDrawerOpen(true);
  };

  const handlePaymentComplete = async (transaction: any, paymentDetails?: { method: string; cashReceived?: number; changeDue?: number }) => {
    console.log("Payment completed with transaction:", transaction);
    try {
      // Update the order's payment status to trigger a refresh
      if (selectedOrderForPayment) {
        // The transaction API already updated the order, but we need to refresh the local data
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }

      // Print the bill after successful payment
      if (selectedOrderForPayment) {
        try {
          // Fetch the latest order from the backend before printing
          const response = await fetch(`/api/orders/${selectedOrderForPayment.id}`);
          let latestOrder = selectedOrderForPayment;
          if (response.ok) {
            latestOrder = await response.json();
          } else {
            console.warn('Failed to fetch latest order for printing, using local copy.');
          }
          await printBillFromOrderAuto(latestOrder as any, true, {
            ...paymentDetails,
            discountMode: (latestOrder as any)?.discountMode ?? "amount",
            discountInput: String((latestOrder as any)?.discountAmount ?? ""),
            isDiscountEnabled: Number((latestOrder as any)?.discountAmount || 0) > 0,
            serviceChargeEnabled: Number((latestOrder as any)?.serviceChargeAmount || 0) > 0,
            serviceChargeRate: Number((latestOrder as any)?.serviceChargeRate || 0),
          } as any);
        } catch (error) {
          console.error('Failed to print bill after payment:', error);
        }
      }

      // Show success toast
      setToast({
        message: `Payment completed successfully! Transaction ID: ${transaction.id?.slice(-8) || 'N/A'}`,
        type: 'success',
        isVisible: true
      });
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setToast(null);
      }, 5000);
    } catch (error) {
      console.error("Error handling payment completion:", error);
      setToast({
        message: "Payment completed but failed to update order status",
        type: 'error',
        isVisible: true
      });
    }
  };

  const closePaymentDrawer = () => {
    setIsPaymentDrawerOpen(false);
    setSelectedOrderForPayment(null);
  };

  const closeRefundDrawer = () => {
    setIsRefundDrawerOpen(false);
    setSelectedOrderForRefund(null);
  };

  const handleRefund = (order: Order) => {
    setSelectedOrderForRefund(order);
    setIsRefundDrawerOpen(true);
  };

  const handleRefundComplete = (refundId: string) => {
    // Refresh the orders data
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    
    // Show success toast
    setToast({
      message: `Refund processed successfully! Refund ID: ${refundId.slice(-8)}`,
      type: 'success',
      isVisible: true
    });
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      setToast(null);
    }, 5000);
    
    closeRefundDrawer();
  };

  const handleAmendOrder = (order: any) => {
    // Store order data in localStorage for the new order page to access
    const orderData = {
      isAmending: true,
      existingOrderId: order.id,
      orderType: order.orderType || 'dine-in',
      tableId: order.tableId,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerId: order.customerId,
      existingItems: (order.orderItems || []).map((item: any) => ({
        key: `existing-${item.productId}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        productId: item.productId,
        productName: item.productName,
        basePrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        addons: [],
        variant: undefined,
        customizationNotes: item.customizationNotes || '',
        // Store the raw product name for parsing later
        rawProductName: item.productName
      }))
    };
    
    localStorage.setItem('amendOrderData', JSON.stringify(orderData));
    
    // Navigate to new order page
    router.push('/dashboard/new-order');
  };

  const handlePrintBill = async (order: Order) => {
    if (order.paymentStatus === "paid") {
      try {
        await printBillFromOrderAuto(order, true, {
          discountMode: (order as any)?.discountMode ?? "amount",
          discountInput: String((order as any)?.discountAmount ?? ""),
          isDiscountEnabled: Number((order as any)?.discountAmount || 0) > 0,
          serviceChargeEnabled: Number((order as any)?.serviceChargeAmount || 0) > 0,
          serviceChargeRate: Number((order as any)?.serviceChargeRate || 0),
        } as any);
        
        setToast({
          message: `Bill printed successfully for order ${order.orderNumber}`,
          type: 'success',
          isVisible: true
        });
        setTimeout(() => {
          setToast(null);
        }, 3000);
      } catch (error) {
        console.error('Failed to print bill:', error);
        setToast({
          message: `Failed to print bill for order ${order.orderNumber}`,
          type: 'error',
          isVisible: true
        });
        setTimeout(() => {
          setToast(null);
        }, 3000);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Failed to load orders. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          {/* Status Tabs */}
          {/* Mobile horizontal scroll */}
          <div className="lg:hidden -mx-2 overflow-x-auto">
            <div className="flex items-center gap-2 px-2 snap-x snap-mandatory">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap snap-start ${
                    activeStatus === status
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {formatStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
          {/* Desktop wrap */}
          <div className="hidden lg:flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  activeStatus === status
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {formatStatusLabel(status)}
              </button>
            ))}
          </div>

          {/* Search and Date Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Current Date Filter Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowOnlyToday(!showOnlyToday);
                  if (!showOnlyToday) {
                    clearCustomDate();
                  }
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                  showOnlyToday && !isCustomDateActive
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                title={showOnlyToday ? "Showing only today's orders" : "Showing all orders"}
              >
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {showOnlyToday && !isCustomDateActive ? "Today" : "All Dates"}
                </span>
              </button>

              {/* Custom Date Picker */}
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customDate ? customDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    handleCustomDateSelect(date);
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Select date"
                />
                {isCustomDateActive && (
                  <button
                    onClick={clearCustomDate}
                    className="px-2 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Clear custom date"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>


            </div>

            {/* Search Bar */}
            <div className="w-full sm:w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number, customer name, or phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>



        {/* Orders Grid */}
        {isSearching ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Loader2 className="h-16 w-16 mx-auto animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Searching...</h3>
            <p className="text-gray-600">Please wait while we search for your orders</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ShoppingCart className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isCustomDateActive ? "No orders on selected date" : showOnlyToday ? "No orders today" : "No orders found"}
            </h3>
            <p className="text-gray-600">
              {searchQuery || activeStatus !== "All"
                ? "Try adjusting your search or filters"
                : isCustomDateActive
                  ? "No orders found on the selected date"
                  : showOnlyToday 
                    ? "No orders have been placed today yet"
                    : "Create your first order to get started"
              }
            </p>
            {(showOnlyToday || isCustomDateActive) && (
              <button
                onClick={() => {
                  clearCustomDate();
                  setShowOnlyToday(false);
                }}
                className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                View all orders instead
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Search Results Count */}
            {(searchQuery || activeStatus !== "All" || showOnlyToday || isCustomDateActive) && (
              <div className="mb-4 text-sm text-gray-600">
                Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
                {activeStatus !== "All" && ` with status "${activeStatus}"`}
                {showOnlyToday && !isCustomDateActive && " from today"}
                {isCustomDateActive && customDate && ` from ${customDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}`}
              </div>
            )}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-full">
              {filteredOrders.map((order) => (
              <div id={`order-card-${order.id}`} key={order.id} className={`bg-white rounded-xl p-3 sm:p-4 lg:p-5 shadow-soft border border-gray-100 hover:shadow-medium transition-shadow duration-200 flex flex-col max-w-full w-full ${highlightOrderId === order.id ? 'ring-2 ring-blue-500' : ''}`}>
                {/* Order Header - Compact Top Bar */}
                <div className="flex items-center justify-between mb-3 min-w-0">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      {order.kotNumber ? formatKOTNumber(order.kotNumber) : `#${order.orderNumber.split('-')[2]}`}
                    </div>
                    {/* Order Type & Table Info */}
                    <span className="inline-flex items-center space-x-1 text-[10px] sm:text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full whitespace-nowrap flex-shrink-0">
                      {order.orderType === "takeaway" ? (
                        <>
                          <Truck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>Takeaway</span>
                        </>
                      ) : order.orderType === "dine-in" && order.tableNumber ? (
                        <>
                          <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>Table {order.tableNumber}</span>
                        </>
                      ) : order.orderType === "delivery" ? (
                        <>
                          <Truck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>Delivery</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>Dine-in</span>
                        </>
                      )}
                    </span>
                  </div>
                  
                  {/* Order Status + Timer - Compact */}
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    {/* Status Display - Show timer for completed orders instead of "Completed" */}
                                         {order.status === "completed" ? (
                       <div className="flex items-center space-x-1">
                         <KitchenTimer
                           createdAt={order.createdAt}
                           startedCookingAt={order.startedCookingAt}
                           readyAt={order.readyAt}
                           updatedAt={order.updatedAt}
                           status={order.status}
                         />
                       </div>
                    ) : (
                    <div className="flex items-center space-x-2">
                      {order.status === "ready" && <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />}
                      {order.status === "in-process" && <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-600" />}
                      {order.status === "pending" && <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-600" />}
                      <span className={`text-[10px] sm:text-xs font-medium ${
                        order.status === "ready" ? "text-blue-600" :
                        order.status === "in-process" ? "text-orange-600" :
                        "text-gray-600"
                      }`}>
                        {order.status === "pending" ? "Queued" :
                         order.status === "in-process" ? "Cooking" :
                         order.status === "ready" ? "Service" :
                         order.status === "cancelled" ? "Cancelled" :
                         order.status}
                      </span>
                    </div>
                    )}
                    
                    {/* Amendment Indicator */}
                    {isOrderAmended(order) && (
                      <span className="text-[10px] sm:text-xs font-medium text-purple-600 opacity-80">✏️ Amended</span>
                    )}
                    
                                         {/* Kitchen Timer - Only show for non-completed orders */}
                     {order.status !== "completed" && (
                    <div className="flex items-center space-x-1">
                      <KitchenTimer
                        createdAt={order.createdAt}
                        startedCookingAt={order.startedCookingAt}
                        readyAt={order.readyAt}
                           updatedAt={order.updatedAt}
                        status={order.status}
                      />
                    </div>
                     )}
                  </div>
                </div>

                {/* Customer Info - Compact Single Line */}
                <div className="mb-2 sm:mb-3 p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs min-w-0">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="font-semibold text-gray-900 truncate text-[10px] sm:text-xs">{order.customerName || (order.customerId ? "Customer" : "Walk-in Customer")}</span>
                      {order.customerPhone && (
                        <span className="text-gray-600 whitespace-nowrap flex-shrink-0 text-[10px] sm:text-xs">• {order.customerPhone}</span>
                      )}
                    </div>
                    <span className="text-gray-500 whitespace-nowrap flex-shrink-0 ml-1 sm:ml-2 text-[10px] sm:text-xs">{formatDate(order.createdAt)} • {formatTime(order.createdAt)}</span>
                  </div>
                </div>

                {/* Order Items - Prominent & Clean with Typewriter Font */}
                <div className="mb-2 sm:mb-3 p-2 sm:p-2.5 bg-white border border-gray-200 rounded-lg min-w-0">
                  <div className="grid grid-cols-12 gap-1 sm:gap-2 text-[10px] sm:text-xs font-medium text-gray-700 border-b border-gray-200 pb-1 mb-1.5">
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-7">Item</div>
                    <div className="col-span-3 text-amber-600">Notes</div>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
                    {(order.orderItems || []).map((item: any, index: number) => (
                      <div key={index} className="grid grid-cols-12 gap-2 py-1 min-w-0">
                        <div className="col-span-2 text-gray-600 font-mono text-[10px] sm:text-xs flex-shrink-0">{item.quantity}</div>
                        <div className="col-span-7 text-gray-900 font-mono text-[10px] sm:text-xs leading-tight truncate" title={item.productName}>{item.productName}</div>
                        <div className="col-span-3 text-amber-600 font-mono text-[10px] sm:text-xs truncate" title={formatNotesForKOT(item.customizationNotes)}>
                          {formatNotesForKOT(item.customizationNotes)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons - Positioned at bottom */}
                <div className="mt-auto pt-2">
                  <div className="flex items-center justify-between w-full space-x-1 sm:space-x-2 min-w-0">
                    {/* Progressive Status Button */}
                    <button 
                      onClick={() => handleProgressiveStatusUpdate(order)}
                      disabled={order.status === "completed" || order.status === "cancelled"}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                        order.status === "completed" || order.status === "cancelled"
                          ? "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
                          : "text-gray-800 bg-gray-200 hover:bg-gray-300 border border-gray-300 hover:border-gray-400"
                      }`}
                      title={getNextStatusInfo(order.status).buttonText}
                    >
                      <div className="h-3 w-3 sm:h-4 sm:w-4">{getNextStatusInfo(order.status).icon}</div>
                    </button>
                    
                    {/* Amend Order Button */}
                    <button 
                      onClick={() => handleAmendOrder(order)}
                      disabled={order.status === "completed" || order.status === "cancelled"}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 border flex-shrink-0 ${
                        order.status === "completed" || order.status === "cancelled"
                          ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-gray-400"
                      }`}
                      title="Amend Order - Add/Remove Items"
                    >
                      <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    
                    {/* Payment/Refund Action */}
                    {order.paymentStatus === "paid" ? (
                      <button 
                        onClick={() => handleRefund(order)}
                        className="p-1.5 sm:p-2 rounded-lg transition-colors duration-200 border text-gray-800 bg-gray-200 hover:bg-gray-300 border-gray-300 hover:border-gray-400 flex-shrink-0"
                        title="Process Refund"
                      >
                        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    ) : order.paymentStatus === "refunded" ? (
                      <button
                        onClick={() => {}}
                        disabled
                        className="p-1.5 sm:p-2 rounded-lg transition-colors duration-200 border text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed flex-shrink-0"
                        title="Refunded"
                      >
                        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handlePayment(order)}
                        className="p-1.5 sm:p-2 rounded-lg transition-colors duration-200 border text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-gray-400 flex-shrink-0"
                        title="Process Payment"
                      >
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    )}
                    
                    {/* Print Bill Button */}
                    <button 
                      onClick={() => handlePrintBill(order)}
                      className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-300 hover:border-gray-400 flex-shrink-0"
                      title="Print Bill"
                    >
                      <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    
                    {/* Cancel Order Button */}
                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={order.status === "cancelled" || order.status === "completed"}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 border disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                        order.status === "cancelled" || order.status === "completed"
                          ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                          : "text-gray-800 hover:text-gray-900 hover:bg-gray-200 border-gray-400 hover:border-gray-500"
                      }`}
                      title="Cancel Order"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        )}
      </div>

      {/* Payment Drawer */}
      {selectedOrderForPayment && (
        <PaymentDrawer
          isOpen={isPaymentDrawerOpen}
          onClose={closePaymentDrawer}
          order={selectedOrderForPayment}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Refund Drawer */}
      {selectedOrderForRefund && (
        <RefundDrawer
          isOpen={isRefundDrawerOpen}
          onClose={closeRefundDrawer}
          order={selectedOrderForRefund}
          onRefundComplete={handleRefundComplete}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
