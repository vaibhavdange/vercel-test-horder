'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Calendar, Wrench, Users, MoreVertical, Edit, Trash2, CheckCircle, XCircle, Clock, MapPin, CreditCard, AlertCircle } from 'lucide-react';
import { Table, TableStatus } from '@/types/tables';
import { parseSupabaseTimestamp, formatHms } from '@/lib/time';
import { useCurrency } from '@/hooks/useCurrency';
import { calculateLegalBilling } from '@/lib/utils/legal-billing';
import { useProducts } from '@/hooks/use-products';
import { useBillingSettings } from '@/hooks/use-billing-settings';
import { useDefaultAlcoholTaxRate } from '@/hooks/use-billing-settings';

interface TableCardProps {
  table: Table;
  onTableClick: (table: Table) => void;
  onStatusChange: (tableId: string, status: TableStatus) => void;
  onEdit?: (table: Table) => void;
  onDelete?: (tableId: string) => void;
  showActions?: boolean;
  isEditMode?: boolean;
  onOpenPayment?: (order: any) => void;
  onAmendOrder?: (order: any) => void;
}

export function TableCard({
  table,
  onTableClick,
  onStatusChange,
  onEdit,
  onDelete,
  showActions = true,
  isEditMode = false,
  onOpenPayment,
  onAmendOrder
}: TableCardProps) {
  const { format } = useCurrency();
  const { data: allProducts } = useProducts();
  const { data: billingSettings } = useBillingSettings();
  const { data: defaultAlcoholTaxRate = 18 } = useDefaultAlcoholTaxRate();

  const [showQuickActions, setShowQuickActions] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Calculate the total payable amount (same as PaymentDrawer)
  const payableAmount = useMemo(() => {
    if (!table.orders?.length) {
      return 0;
    }

    // Get the most recent order (should be first due to ordering, but add safety check)
    const sortedOrders = [...(table.orders || [])].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const order = sortedOrders[0];

    // If the order already has all the calculated fields, use them
    if (order.subtotal && order.taxAmount !== undefined && order.serviceChargeAmount !== undefined && order.discountAmount !== undefined) {
      const calculatedTotal = (order.subtotal || 0) + (order.taxAmount || 0) + (order.serviceChargeAmount || 0) - (order.discountAmount || 0);
      return calculatedTotal;
    }

    // Fallback to the stored totalAmount if calculation isn't possible
    return order.totalAmount || 0;
  }, [table.orders, allProducts, billingSettings, defaultAlcoholTaxRate]);

  useEffect(() => {
    if (!showQuickActions) return;
    const updatePosition = () => {
      if (menuButtonRef.current) {
        const rect = menuButtonRef.current.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom + 8, left: rect.right });
      }
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showQuickActions]);

  const getTableStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'border-green-400 bg-green-50 text-green-700';
      case 'occupied':
        return 'border-blue-400 bg-blue-50 text-blue-700';
      case 'reserved':
        return 'border-yellow-400 bg-yellow-50 text-yellow-700';
      case 'cleaning':
        return 'border-orange-400 bg-orange-50 text-orange-700';
      case 'unavailable':
        return 'border-gray-300 bg-gray-50 text-gray-600';
      default:
        return 'border-gray-300 bg-gray-50 text-gray-600';
    }
  };

  const getStatusPillColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reserved':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cleaning':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusRingClass = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'ring-emerald-200';
      case 'occupied':
        return 'ring-sky-200';
      case 'reserved':
        return 'ring-amber-200';
      case 'cleaning':
        return 'ring-violet-200';
      case 'unavailable':
        return 'ring-red-200';
      default:
        return 'ring-gray-200';
    }
  };

  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case 'occupied':
        return <Eye className="w-3 h-3" />;
      case 'reserved':
        return <Calendar className="w-3 h-3" />;
      case 'cleaning':
        return <Wrench className="w-3 h-3" />;
      case 'available':
        return <CheckCircle className="w-3 h-3" />;
      case 'unavailable':
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'reserved':
        return 'Reserved';
      case 'cleaning':
        return 'Cleaning';
      case 'unavailable':
        return 'Unavailable';
      default:
        return 'Unknown';
    }
  };

  const handleQuickAction = (action: TableStatus | 'edit' | 'delete') => {
    if (action === 'edit' && onEdit) {
      onEdit(table);
    } else if (action === 'delete' && onDelete) {
      onDelete(table.id);
    } else if (typeof action === 'string' && ['available', 'occupied', 'reserved', 'cleaning', 'unavailable'].includes(action)) {
      onStatusChange(table.id, action as TableStatus);
    }
    setShowQuickActions(false);
  };

  const isClickable = table.status !== 'unavailable' && table.status !== 'cleaning';

  return (
    <div className={`relative group table-card ${isEditMode ? 'edit-mode' : ''}`}>
      <div
        className={`
          relative rounded-2xl border-2 shadow-sm p-4 h-full
          ${getTableStatusColor(table.status)}
          bg-white
          ring-2 ring-offset-2 ring-offset-white ${getStatusRingClass(table.status)}
        `}
        onClick={() => isClickable && onTableClick(table)}
        style={{ cursor: isClickable ? 'pointer' : 'default' }}
      >
        {/* Header with Table ID and Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {table.tableNumber}
            </h3>
            
            {/* Status Pill */}
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusPillColor(table.status)}`}>
              {getStatusIcon(table.status)}
              <span>{getStatusLabel(table.status)}</span>
            </div>
          </div>

          {/* Quick Actions Menu */}
          {showActions && (
            <div className="relative">
              <button
                ref={menuButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickActions(!showQuickActions);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg opacity-100 transition-all duration-200"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Table Details */}
        <div className="space-y-2.5">
          {/* Capacity */}
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>{table.capacity} seats</span>
            </div>
          </div>

          {/* Area/Floor Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>{table.area?.name} • {table.floor?.name}</span>
          </div>

          {/* CTA Button for Available Tables */}
          {table.status === 'available' && (
            <button
              className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/dashboard/new-order?table=${table.id}`;
              }}
            >
              Click to Seat Now
            </button>
          )}
          {/* Optional: Elapsed Time for Occupied Tables */}
          {table.status === 'occupied' && table.orders?.length > 0 && (() => {
            const sortedOrders = [...(table.orders || [])].sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const currentOrder = sortedOrders[0];
            return (
              <div className="flex items-center justify-between">
                <OccupiedTimer 
                  createdAt={currentOrder?.createdAt as any} 
                  status={currentOrder?.status as any}
                />
                {/* Bill Button - Text only */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenPayment?.(currentOrder); }}
                  // disabled={currentOrder.paymentStatus === 'paid'}
                  className={`text-xs font-medium ${
                    currentOrder.paymentStatus === 'paid'
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }`}
                  // title={currentOrder.paymentStatus === 'paid' ? 'Bill already paid' : 'Pay bill'}
                >
                  <span>
                    {payableAmount > 0 ? format(payableAmount) : 'Pay Bill'}
                  </span>
                  {currentOrder.paymentStatus === 'paid' && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              </div>
            );
          })()}
        </div>


        {/* Quick Actions Dropdown (Portal) */}
        {showQuickActions && showActions && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed z-[110] bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-40 pointer-events-auto"
            style={{ top: menuPosition.top, left: menuPosition.left, transform: 'translateX(-100%)' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Status Actions */}
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
              Quick Actions
            </div>
            
            {table.status !== 'available' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleQuickAction('available'); }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                Mark Available
              </button>
            )}
            
            {table.status !== 'occupied' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleQuickAction('occupied'); }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                Mark Occupied
              </button>
            )}
            
            {table.status !== 'reserved' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleQuickAction('reserved'); }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-yellow-600" /> 
                Mark Reserved
              </button>
            )}
            
            {table.status !== 'cleaning' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleQuickAction('cleaning'); }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-2"
              >
                <Wrench className="w-4 h-4 text-purple-600" />
                Mark Cleaning
              </button>
            )}
            
            {table.status !== 'unavailable' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleQuickAction('unavailable'); }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                Mark Unavailable
              </button>
            )}

            {/* Divider */}
            {(onEdit || onDelete) && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  Management
                </div>
              </>
            )}

            {/* Edit Action */}
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleQuickAction('edit'); }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4 text-blue-600" />
                Edit Table
              </button>
            )}

            {/* Delete Action */}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleQuickAction('delete'); }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                Delete Table
              </button>
            )}
          </div>,
          document.body
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showQuickActions && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100]"
          onClick={() => setShowQuickActions(false)}
          style={{ pointerEvents: 'auto' }}
        />,
        document.body
      )}
    </div>
  );
}

function OccupiedTimer({ createdAt, status }: { createdAt?: string | Date; status?: string }) {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = parseSupabaseTimestamp(startTime);
    const end = endTime ? parseSupabaseTimestamp(endTime) : currentTime;
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const getTimerInfo = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock className="w-3 h-3 text-yellow-500" />,
          text: formatDuration(createdAt as string),
          color: "text-yellow-600"
        };
      case "in-process":
        return {
          icon: <Clock className="w-3 h-3 text-orange-500" />,
          text: formatDuration(createdAt as string),
          color: "text-orange-600"
        };
      case "ready":
        return {
          icon: <CheckCircle className="w-3 h-3 text-green-500" />,
          text: "Ready",
          color: "text-green-600"
        };
      case "completed":
        return {
          icon: <CheckCircle className="w-3 h-3 text-green-500" />,
          text: "Completed",
          color: "text-green-600"
        };
      case "cancelled":
        return {
          icon: <AlertCircle className="w-3 h-3 text-red-500" />,
          text: "Cancelled",
          color: "text-red-600"
        };
      default:
        return {
          icon: <Clock className="w-3 h-3 text-blue-500" />,
          text: formatDuration(createdAt as string),
          color: "text-blue-600"
        };
    }
  };

  const timerInfo = getTimerInfo();

  return (
    <div className="flex items-center gap-2 text-xs">
      {timerInfo.icon}
      <span className={`font-medium ${timerInfo.color}`}>
        {timerInfo.text}
      </span>
    </div>
  );
}
