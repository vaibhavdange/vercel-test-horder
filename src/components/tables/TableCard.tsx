'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Calendar, Wrench, Users, MoreVertical, Edit, Trash2, CheckCircle, XCircle, Clock, MapPin, CreditCard, PlusCircle } from 'lucide-react';
import { Table, TableStatus } from '@/types/tables';
import { useCurrency } from '@/hooks/useCurrency';

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
  const [showQuickActions, setShowQuickActions] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

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
        return 'status-available';
      case 'occupied':
        return 'status-occupied';
      case 'reserved':
        return 'status-reserved';
      case 'cleaning':
        return 'status-cleaning';
      case 'unavailable':
        return 'status-unavailable';
      default:
        return 'border-gray-300';
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
          relative rounded-xl border-2 shadow-sm p-4 transition-all duration-200 hover:shadow-md h-full
          ${getTableStatusColor(table.status)}
          bg-white hover:bg-gray-50 table-card-hover
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
                className="p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Table Details */}
        <div className="space-y-2.5">
          {/* Capacity */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4 text-gray-500" />
            <span>{table.capacity} seats</span>
          </div>

          {/* Area/Floor Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>{table.area?.name} • {table.floor?.name}</span>
          </div>

          {/* Optional: Elapsed Time for Occupied Tables */}
          {table.status === 'occupied' && (
            <OccupiedTimer createdAt={table.orders?.[0]?.createdAt as any} />
          )}
        </div>

        {/* Bill and Amend Buttons - Positioned at bottom right */}
        {table.status === 'occupied' && table.orders?.[0] && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {/* Bill Button - Disabled if already paid */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenPayment?.(table.orders![0]); }}
              disabled={table.orders[0].paymentStatus === 'paid'}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
                table.orders[0].paymentStatus === 'paid'
                  ? 'bg-green-50 text-green-700 border-green-200 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
              title={table.orders[0].paymentStatus === 'paid' ? 'Bill already paid' : 'Pay bill'}
            >
              <CreditCard className="w-3 h-3" />
              <span>
                {format(table.orders[0].totalAmount || 0)}
              </span>
              {table.orders[0].paymentStatus === 'paid' && (
                <span className="ml-1 text-xs">✓</span>
              )}
            </button>
            
            {/* Amend Button - Only show if order is not completed */}
            {table.orders[0].status !== 'completed' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAmendOrder?.(table.orders![0]); }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                title="Amend order"
              >
                <PlusCircle className="w-3 h-3" /> Amend
              </button>
            )}
          </div>
        )}

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

function OccupiedTimer({ createdAt }: { createdAt?: string | Date }) {
  const [elapsed, setElapsed] = React.useState<string>('');
  useEffect(() => {
    const start = createdAt ? new Date(createdAt).getTime() : Date.now();
    const format = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const hh = hours > 0 ? `${hours}:` : '';
      const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
      const ss = String(seconds).padStart(2, '0');
      return `${hh}${mm}:${ss}`;
    };
    const tick = () => setElapsed(format(Date.now() - start));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);
  return (
    <div className="flex items-center gap-2 text-xs text-blue-600">
      <Clock className="w-3 h-3" />
      <span>{elapsed || '00:00'}</span>
    </div>
  );
}
