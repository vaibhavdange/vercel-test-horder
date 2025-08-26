"use client";

import { useState, useEffect } from 'react';
import { useRestaurantStore } from '@/lib/store';
import { Order } from '@/types/orders';
import { 
  Truck, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle, 
  XCircle,
  Play,
  Pause,
  Square,
  MessageSquare,
  Printer,
  Eye
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface DeliveryViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeliveryView({ isOpen, onClose }: DeliveryViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Order | null>(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  
  // Currency formatter
  const { format } = useCurrency();

  const { 
    orders, 
    setOrderStatus,
    markSMSSent,
    markBillPrinted
  } = useRestaurantStore();

  // Filter delivery orders
  const deliveryOrders = orders.filter(order => order.orderType === 'takeaway');
  
  const getStatusCount = (status: string) => {
    if (status === 'all') return deliveryOrders.length;
    return deliveryOrders.filter(order => order.status === status).length;
  };

  const filteredDeliveries = deliveryOrders.filter(order => {
    if (selectedStatus === 'all') return true;
    return order.status === selectedStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'out-for-delivery': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Delivery Orders</h2>
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
            { key: 'out-for-delivery', label: 'Out', count: getStatusCount('out-for-delivery') },
            { key: 'delivered', label: 'Delivered', count: getStatusCount('delivered') }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`p-2 text-sm font-medium rounded-lg transition-colors ${
                selectedStatus === key
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
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

      {/* Delivery Orders List */}
      <div className="p-4 space-y-3">
        {filteredDeliveries.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Truck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>No delivery orders found</p>
            <p className="text-sm">Delivery orders will appear here</p>
          </div>
        ) : (
          filteredDeliveries.map((order) => (
            <div
              key={order.id}
              className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-green-300"
              onClick={() => {
                setSelectedDelivery(order);
                setShowDeliveryDetails(true);
              }}
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg">#{order.id.slice(-6)}</span>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {getTimeElapsed(new Date(order.createdAt))}
                </span>
              </div>

              {/* Customer Info */}
              <div className="space-y-2 mb-3">
                {order.customerName && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{order.customerName}</span>
                  </div>
                )}
                {order.customerPhone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{order.customerPhone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Truck className="h-4 w-4" />
                  <span>{order.items.length} items</span>
                </div>
              </div>

              {/* Order Total */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">
                  Total: {format(order.total)}
                </span>
                <div className="flex space-x-1">
                  {!order.billPrinted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markBillPrinted(order.id);
                      }}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                      title="Print Bill"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  )}
                  {!order.smsSent && order.customerPhone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markSMSSent(order.id);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="Send SMS"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDelivery(order);
                      setShowDeliveryDetails(true);
                    }}
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delivery Details Modal */}
      {showDeliveryDetails && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Delivery #{selectedDelivery.id.slice(-6)}
              </h3>
              <button
                onClick={() => setShowDeliveryDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Square className="h-5 w-5" />
              </button>
            </div>

            {/* Delivery Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedDelivery.status}
                  onChange={(e) => setOrderStatus(selectedDelivery.id, e.target.value as Order['status'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="out-for-delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  {selectedDelivery.customerName && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{selectedDelivery.customerName}</span>
                    </div>
                  )}
                  {selectedDelivery.customerPhone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedDelivery.customerPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedDelivery.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{item.quantity}x {item.productName}</p>
                        {item.customizationNotes && (
                          <p className="text-xs text-gray-500">{item.customizationNotes}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium">{format(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal:</span>
                  <span>{format(selectedDelivery.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tax:</span>
                  <span>{format(selectedDelivery.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Discount:</span>
                  <span>-{format(selectedDelivery.discountAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>{format(selectedDelivery.totalAmount)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => {
                    if (selectedDelivery.status === 'ready') {
                      setOrderStatus(selectedDelivery.id, 'out-for-delivery');
                    } else if (selectedDelivery.status === 'out-for-delivery') {
                      setOrderStatus(selectedDelivery.id, 'delivered');
                    }
                    setShowDeliveryDetails(false);
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {selectedDelivery.status === 'ready' ? 'Start Delivery' : 
                   selectedDelivery.status === 'out-for-delivery' ? 'Mark Delivered' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

