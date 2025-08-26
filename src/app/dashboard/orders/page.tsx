"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Trash2, CheckCircle, Clock, AlertCircle, CreditCard, Loader2, ShoppingCart, PlusCircle, X, Truck, Users, Printer, RotateCcw } from "lucide-react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { OrderFilters } from "@/types/orders";
import KitchenTimer from "@/components/ui/KitchenTimer";
import PaymentDrawer from "@/components/ui/PaymentDrawer";
import { printBillFromOrder } from "@/lib/print/bill";
import RefundDrawer from "@/components/ui/RefundDrawer";
import { Order } from "@/types/orders";
import { formatKOTNumber } from "@/lib/utils";
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
  const router = useRouter();
  const queryClient = useQueryClient();

  const statusOptions = ["All", "Takeaway", "Queued", "Cooking", "Service", "completed", "cancelled", "Paid", "Unpaid", "Refunded"];

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch orders from database using debounced search
  const { data: orders = [], isLoading, error } = useOrders({
    status: activeStatus === "All" ? undefined : 
            activeStatus === "Takeaway" ? undefined : // We'll filter takeaway and payment statuses on the frontend
            activeStatus === "Paid" ? undefined :
            activeStatus === "Unpaid" ? undefined :
            activeStatus === "Refunded" ? undefined :
            activeStatus === "Queued" ? "pending" :
            activeStatus === "Cooking" ? "in-process" :
            activeStatus === "Service" ? "ready" : activeStatus,
    search: debouncedSearchQuery || undefined,
  });

  // Filter orders based on active status
  const filteredOrders = useMemo(() => {
    if (activeStatus === "All") return orders.filter(order => order.status !== "completed");
    if (activeStatus === "Takeaway") return orders.filter(order => order.orderType === "takeaway");
    if (activeStatus === "Paid") return orders.filter(order => order.paymentStatus === "paid");
    if (activeStatus === "Unpaid") return orders.filter(order => order.paymentStatus === "pending");
    if (activeStatus === "Refunded") return orders.filter(order => order.paymentStatus === "refunded");
    return orders;
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
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
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
        // This will trigger a refetch of the orders and update the UI
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
      
      // Print bill now that payment is complete
      try {
        if (selectedOrderForPayment) {
          await printBillFromOrder(selectedOrderForPayment, true, paymentDetails);
        }
      } catch (e) {
        console.error('Print after payment failed:', e);
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
      orderType: order.orderType,
      tableId: order.tableId,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerId: order.customerId,
      existingItems: order.orderItems.map((item: any) => ({
        id: item.productId,
        name: item.productName,
        price: item.unitPrice,
        quantity: item.quantity,
        total: item.totalPrice,
        customizationNotes: item.customizationNotes
      }))
    };
    
    localStorage.setItem('amendOrderData', JSON.stringify(orderData));
    
    // Navigate to new order page
    router.push('/dashboard/new-order');
  };

  const handlePrintBill = (order: Order) => {
    if (order.paymentStatus === "paid") {
      // In a real application, you would trigger a print dialog or a new window
      // For demonstration, we'll just show a toast
      setToast({
        message: `Printing duplicate bill for order ${order.orderNumber}...`,
        type: 'success',
        isVisible: true
      });
      setTimeout(() => {
        setToast(null);
      }, 3000); // Hide after 3 seconds
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
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
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

          {/* Search Bar - smaller width */}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {searchQuery || activeStatus !== "All" 
                ? "Try adjusting your search or filters"
                : "Create your first order to get started"
              }
            </p>
          </div>
        ) : (
          <>
            {/* Search Results Count */}
            {(searchQuery || activeStatus !== "All") && (
              <div className="mb-4 text-sm text-gray-600">
                Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
                {activeStatus !== "All" && ` with status "${activeStatus}"`}
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
              <div id={`order-card-${order.id}`} key={order.id} className={`bg-white rounded-xl p-6 shadow-soft border border-gray-100 hover:shadow-medium transition-shadow duration-200 flex flex-col ${highlightOrderId === order.id ? 'ring-2 ring-blue-500' : ''}`}>
                {/* Order Header - Compact Top Bar */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl font-bold text-gray-900">
                      {order.kotNumber ? formatKOTNumber(order.kotNumber) : order.orderNumber.split('-')[2]}
                    </div>
                    {/* Order Type & Table Info */}
                    <span className="inline-flex items-center space-x-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {order.orderType === "takeaway" ? (
                        <>
                          <Truck className="h-3 w-3" />
                          <span>Takeaway</span>
                        </>
                      ) : order.orderType === "dine-in" && order.tableNumber ? (
                        <>
                          <Users className="h-3 w-3" />
                          <span>Table {order.tableNumber}</span>
                        </>
                      ) : order.orderType === "delivery" ? (
                        <>
                          <Truck className="h-3 w-3" />
                          <span>Delivery</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3" />
                          <span>Dine-in</span>
                        </>
                      )}
                    </span>
                  </div>
                  
                  {/* Order Status + Timer - Compact */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {order.status === "completed" && <CheckCircle className="h-3 w-3 text-green-600" />}
                      {order.status === "ready" && <CheckCircle className="h-3 w-3 text-blue-600" />}
                      {order.status === "in-process" && <Clock className="h-3 w-3 text-orange-600" />}
                      {order.status === "pending" && <Clock className="h-3 w-3 text-gray-600" />}
                      <span className={`text-xs font-medium ${
                        order.status === "completed" ? "text-green-600" :
                        order.status === "ready" ? "text-blue-600" :
                        order.status === "in-process" ? "text-orange-600" :
                        "text-gray-600"
                      }`}>
                        {order.status === "pending" ? "Queued" :
                         order.status === "in-process" ? "Cooking" :
                         order.status === "ready" ? "Service" :
                         order.status === "completed" ? "Completed" :
                         order.status === "cancelled" ? "Cancelled" :
                         order.status}
                      </span>
                    </div>
                    
                    {/* Amendment Indicator */}
                    {isOrderAmended(order) && (
                      <span className="text-xs font-medium text-purple-600 opacity-80">✏️ Amended</span>
                    )}
                    
                    {/* Kitchen Timer - Compact */}
                    <div className="flex items-center space-x-1">
                      <KitchenTimer
                        createdAt={order.createdAt}
                        startedCookingAt={order.startedCookingAt}
                        readyAt={order.readyAt}
                        status={order.status}
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Info - Compact Single Line */}
                <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-900">{order.customerName || (order.customerId ? "Customer" : "Walk-in Customer")}</span>
                      {order.customerPhone && (
                        <span className="text-gray-600">• {order.customerPhone}</span>
                      )}
                    </div>
                    <span className="text-gray-500">{formatDate(order.createdAt)} • {formatTime(order.createdAt)}</span>
                  </div>
                </div>

                {/* Order Items - Prominent & Clean with Typewriter Font */}
                <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 border-b border-gray-200 pb-1 mb-2">
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-6">Item</div>
                    <div className="col-span-4 text-amber-600">Notes</div>
                  </div>
                  {order.orderItems.map((item: any, index: number) => (
                    <div key={index} className="grid grid-cols-12 gap-2 py-1">
                      <div className="col-span-2 text-gray-600 font-mono text-xs">{item.quantity}</div>
                      <div className="col-span-6 text-gray-900 font-mono text-xs leading-tight">{item.productName}</div>
                      <div className="col-span-4 text-amber-600 font-mono text-xs">
                        {formatNotesForKOT(item.customizationNotes)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons - Positioned at bottom */}
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between w-full space-x-3">
                    {/* Progressive Status Button */}
                    <button 
                      onClick={() => handleProgressiveStatusUpdate(order)}
                      disabled={order.status === "completed" || order.status === "cancelled"}
                      className={`p-2.5 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getNextStatusInfo(order.status).buttonColor}`}
                      title={getNextStatusInfo(order.status).buttonText}
                    >
                      {getNextStatusInfo(order.status).icon}
                    </button>
                    
                    {/* Amend Order Button */}
                    <button 
                      onClick={() => handleAmendOrder(order)}
                      disabled={order.status === "completed" || order.status === "cancelled"}
                                             className="p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-300"
                      title="Amend Order - Add/Remove Items"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                    
                    {/* Cancel Order Button */}
                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={order.status === "cancelled" || order.status === "completed"}
                      className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 border border-red-200 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Cancel Order"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    {/* Payment/Refund Action */}
                    {order.paymentStatus === "paid" ? (
                      <button 
                        onClick={() => handleRefund(order)}
                        className="p-2.5 rounded-lg transition-colors duration-200 border text-red-600 bg-red-50 border-red-200 hover:bg-red-100"
                        title="Process Refund"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : order.paymentStatus === "refunded" ? (
                      <button
                        onClick={() => {}}
                        disabled
                        className="p-2.5 rounded-lg transition-colors duration-200 border text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
                        title="Refunded"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handlePayment(order)}
                        className="p-2.5 rounded-lg transition-colors duration-200 border text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border-yellow-200 hover:border-yellow-300"
                        title="Process Payment"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                    )}
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
