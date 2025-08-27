"use client";

import { useState, useEffect } from 'react';
import { useRestaurantStore } from '@/lib/store';
import { OrderItem, Order } from '@/types/orders';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Pause, 
  Square,
  Printer,
  MessageSquare,
  Eye,
  Edit,
  Users,
  Truck,
  ChefHat
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

// Define RestaurantOrder type locally since it's not exported from the store
interface RestaurantOrder {
  id: string;
  orderNumber: string;
  kotNumber?: number;
  orderType: "dine-in" | "takeaway" | "delivery";
  tableNumber?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  status: "pending" | "in-process" | "ready" | "completed" | "cancelled" | "out-for-delivery" | "delivered";
  subStatus?: string;
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  serviceChargeRate: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "refunded";
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  startedCookingAt?: string;
  readyAt?: string;
  updatedAt: string;
  customer?: any;
  orderItems: OrderItem[];
  // Additional properties from RestaurantOrder
  items: OrderItem[];
  total: number;
  priority: 'normal' | 'urgent' | 'rush';
  kotPrinted: boolean;
  billPrinted: boolean;
  smsSent: boolean;
  startedPreparingAt?: Date;
  estimatedReadyAt?: Date;
  servedAt?: Date;
  paidAt?: Date;
}

interface KOTViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KOTView({ isOpen, onClose }: KOTViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedKOT, setSelectedKOT] = useState<RestaurantOrder | null>(null);
  const [showKOTDetails, setShowKOTDetails] = useState(false);
  
  // Currency formatter
  const { format } = useCurrency();

  const { 
    orders, 
    setOrderStatus, 
    setOrderPriority,
    markKOTPrinted,
    markBillPrinted,
    markSMSSent
  } = useRestaurantStore();

  const getStatusCount = (status: string) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status === status).length;
  };

  const getUrgentCount = () => {
    return orders.filter(order => order.priority === 'urgent').length;
  };

  const filteredOrders = orders.filter(order => {
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'urgent') return order.priority === 'urgent';
    return order.status === selectedStatus;
  });

  // Prefer backend-provided orderItems; fallback to local items
  const getOrderItems = (o: { orderItems?: OrderItem[]; items?: OrderItem[] }): OrderItem[] => {
    if (o?.orderItems && o.orderItems.length > 0) return o.orderItems;
    return o?.items || [];
  };

  const handleStatusChange = (orderId: string, newStatus: RestaurantOrder['status']) => {
    setOrderStatus(orderId, newStatus);
  };

  const handlePriorityChange = (orderId: string, newPriority: RestaurantOrder['priority']) => {
    setOrderPriority(orderId, newPriority);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'served': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'paid': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getDisplayStatus = (status: string) => {
    if (status === 'completed') return 'Completed';
    if (status === 'cancelled') return 'Cancelled';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'rush': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getTimeElapsed = (createdAt: Date) => {
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6" />
            <h2 className="text-lg font-semibold">KOT View</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <Square className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'all', label: 'All', count: getStatusCount('all') },
            { key: 'pending', label: 'Pending', count: getStatusCount('pending') },
            { key: 'preparing', label: 'Preparing', count: getStatusCount('preparing') },
            { key: 'ready', label: 'Ready', count: getStatusCount('ready') },
            { key: 'served', label: 'Served', count: getStatusCount('served') },
            { key: 'urgent', label: 'Urgent', count: getUrgentCount() }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`p-2 text-sm font-medium rounded-lg transition-colors ${
                selectedStatus === key
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-center">
                <div className="font-bold">{count}</div>
                <div className="text-xs">{label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* KOT List */}
      <div className="p-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <ChefHat className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>No orders found</p>
            <p className="text-sm">Orders will appear here</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                order.priority === 'urgent' 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => {
                setSelectedKOT(order);
                setShowKOTDetails(true);
              }}
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg">#{order.id.slice(-6)}</span>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                  {getDisplayStatus(order.status)}
                </span>
              </div>

              {/* Order Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {order.orderType === 'dine-in' ? (
                    <Users className="h-4 w-4" />
                  ) : (
                    <Truck className="h-4 w-4" />
                  )}
                  <span>{order.orderType} • {getOrderItems(order).length} items</span>
                </div>
                {order.tableNumber && (
                  <div className="text-sm text-gray-600">
                    Table: {order.tableNumber}
                  </div>
                )}
                {order.customerName && (
                  <div className="text-sm text-gray-600">
                    Customer: {order.customerName}
                  </div>
                )}
                {/* Show notes preview if any items have notes */}
                {order.items.some(item => item.customizationNotes) && (
                  <div className="text-xs text-amber-600 font-medium">
                    📝 Has special instructions
                  </div>
                )}
              </div>

              {/* Notes Section */}
              {order.notes && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-500 font-mono text-sm">📝</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-mono leading-relaxed">
                        {order.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Info */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{getTimeElapsed(new Date(order.createdAt))}</span>
                </div>
                <span className="font-medium text-gray-900">
                  {format(order.total)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {!order.kotPrinted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markKOTPrinted(order.id);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="Print KOT"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  )}
                  {!order.billPrinted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markBillPrinted(order.id);
                      }}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                      title="Print Bill"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  {!order.smsSent && order.customerPhone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markSMSSent(order.id);
                      }}
                      className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded"
                      title="Send SMS"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedKOT(order);
                      setShowKOTDetails(true);
                    }}
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Edit functionality
                    }}
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                    title="Edit Order"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* KOT Details Modal */}
      {showKOTDetails && selectedKOT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                KOT #{selectedKOT.id.slice(-6)}
              </h3>
              <button
                onClick={() => setShowKOTDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Square className="h-5 w-5" />
              </button>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedKOT.status}
                    onChange={(e) => handleStatusChange(selectedKOT.id, e.target.value as RestaurantOrder['status'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="served">Served</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={selectedKOT.priority}
                    onChange={(e) => handlePriorityChange(selectedKOT.id, e.target.value as RestaurantOrder['priority'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="rush">Rush</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-700 border-b border-gray-200 pb-1">
                    <span>Qty</span>
                    <span>Item</span>
                    <span className="text-amber-600">Notes</span>
                  </div>
                  
                  {/* Table Rows */}
                  {getOrderItems(selectedKOT).map((item) => (
                    <div key={item.id} className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-2">
                      <span className="font-medium">{item.quantity}</span>
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-amber-600 text-xs">
                        {item.customizationNotes || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal:</span>
                  <span>{format(selectedKOT.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tax:</span>
                  <span>{format(selectedKOT.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Discount:</span>
                  <span>-{format(selectedKOT.discountAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>{format(selectedKOT.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

