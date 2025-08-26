'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Clock, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Utensils,
  CreditCard,
  MoreHorizontal,
  Wifi,
  Car,
  Sun,
  Volume2,
  Gift,
  Crown
} from 'lucide-react';
import { TableExtended, ExtendedTableStatus, QuickAction, Reservation, Guest } from '@/types/restaurant';

interface InteractiveTableCardProps {
  table: TableExtended;
  onQuickAction: (action: string, tableId: string, data?: any) => void;
  onTableSelect: (table: TableExtended) => void;
  isSelected: boolean;
  scale: number;
  showDetails: boolean;
  quickActions: QuickAction[];
  reservations: Reservation[];
  className?: string;
}

export function InteractiveTableCard({
  table,
  onQuickAction,
  onTableSelect,
  isSelected,
  scale = 1,
  showDetails = true,
  quickActions = [],
  reservations = [],
  className = ''
}: InteractiveTableCardProps) {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const currentReservation = reservations.find(r => 
    r.tableId === table.id && 
    r.status === 'seated' && 
    new Date() >= r.startTime && 
    new Date() <= r.endTime
  );

  const upcomingReservation = reservations.find(r => 
    r.tableId === table.id && 
    r.status === 'confirmed' && 
    new Date() < r.startTime
  );

  const isOverstaying = table.currentGuests?.isOverstaying || false;
  const isVip = currentReservation?.isVip || upcomingReservation?.isVip || false;
  const hasSpecialOccasion = currentReservation?.guest?.specialOccasions?.some(
    occasion => new Date().toDateString() === occasion.date.toDateString()
  ) || false;

  // Touch and mouse event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (e.pointerType === 'touch') {
      const timer = setTimeout(() => {
        setShowQuickMenu(true);
        navigator.vibrate?.(50); // Haptic feedback
      }, 500);
      setLongPressTimer(timer);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (!isDragging && !showQuickMenu) {
      onTableSelect(table);
    }
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (longPressTimer) {
      setIsDragging(true);
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Double tap handler
  const handleDoubleClick = () => {
    const primaryAction = quickActions.find(action => action.isEnabled(table));
    if (primaryAction) {
      primaryAction.action(table.id);
    }
  };

  // Get table styling based on status and conditions
  const getTableStyling = () => {
    let baseClasses = `
      relative transition-all duration-300 rounded-xl border-2 cursor-pointer select-none
      transform-gpu will-change-transform
      ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}
      ${className}
    `;

    // Status-based styling
    switch (table.status as ExtendedTableStatus) {
      case 'available':
        baseClasses += ' bg-green-50 border-green-300 hover:bg-green-100 hover:shadow-lg';
        break;
      case 'occupied':
        baseClasses += isOverstaying 
          ? ' bg-red-50 border-red-400 animate-pulse' 
          : ' bg-yellow-50 border-yellow-400 hover:bg-yellow-100';
        break;
      case 'reserved':
        baseClasses += ' bg-blue-50 border-blue-400 hover:bg-blue-100';
        break;
      case 'cleaning':
        baseClasses += ' bg-purple-50 border-purple-400 hover:bg-purple-100';
        break;
      case 'unavailable':
        baseClasses += ' bg-gray-100 border-gray-400 opacity-60';
        break;
      case 'needs_attention':
        baseClasses += ' bg-orange-50 border-orange-400 hover:bg-orange-100 animate-pulse';
        break;
      case 'check_dropped':
        baseClasses += ' bg-cyan-50 border-cyan-400 hover:bg-cyan-100';
        break;
      case 'ready_to_clear':
        baseClasses += ' bg-indigo-50 border-indigo-400 hover:bg-indigo-100';
        break;
      default:
        baseClasses += ' bg-gray-50 border-gray-300 hover:bg-gray-100';
    }

    // VIP styling
    if (isVip) {
      baseClasses += ' ring-2 ring-yellow-400 ring-opacity-75';
    }

    return baseClasses;
  };

  const getTableShape = () => {
    const size = Math.max(80 * scale, 60);
    
    switch (table.shape) {
      case 'round':
        return { borderRadius: '50%', width: size, height: size };
      case 'booth':
        return { borderRadius: '8px 8px 20px 20px', width: size * 1.2, height: size };
      case 'rectangle':
        return { borderRadius: '8px', width: size * 1.4, height: size };
      default:
        return { borderRadius: '8px', width: size, height: size };
    }
  };

  const getStatusIcon = () => {
    switch (table.status) {
      case 'available': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'occupied': return <Users className="w-4 h-4 text-yellow-600" />;
      case 'reserved': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'cleaning': return <Utensils className="w-4 h-4 text-purple-600" />;
      case 'needs_attention': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'check_dropped': return <CreditCard className="w-4 h-4 text-cyan-600" />;
      case 'ready_to_clear': return <Eye className="w-4 h-4 text-indigo-600" />;
      default: return null;
    }
  };

  const getTableAttributes = () => {
    return table.attributes.map(attr => {
      switch (attr.type) {
        case 'window': return <Sun key={attr.type} className="w-3 h-3 text-yellow-500" />;
        case 'booth': return <Volume2 key={attr.type} className="w-3 h-3 text-blue-500" />;
        case 'outdoor': return <Car key={attr.type} className="w-3 h-3 text-green-500" />;
        case 'quiet': return <Wifi key={attr.type} className="w-3 h-3 text-gray-500" />;
        default: return null;
      }
    });
  };

  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // Update menu position when quick menu opens
  useEffect(() => {
    if (!showQuickMenu) return;
    const updatePosition = () => {
      const el = cardRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
      }
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showQuickMenu]);

  return (
    <div
      ref={cardRef}
      className={getTableStyling()}
      style={{
        ...getTableShape(),
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        position: 'absolute',
        left: table.position.x,
        top: table.position.y,
        zIndex: isSelected ? 20 : 10
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
      aria-label={`Table ${table.tableNumber} - ${table.status}`}
    >
      {/* Special occasion indicator */}
      {hasSpecialOccasion && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center z-10">
          <Gift className="w-3 h-3 text-white" />
        </div>
      )}

      {/* VIP indicator */}
      {isVip && (
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center z-10">
          <Crown className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Overstaying indicator */}
      {isOverstaying && (
        <div className="absolute top-0 left-0 w-full h-full border-2 border-red-500 rounded-xl animate-ping" />
      )}

      {/* Main content */}
      <div className="flex flex-col items-center justify-center h-full p-2 text-center">
        {/* Table number */}
        <div className="font-bold text-lg text-gray-800 mb-1">
          {table.tableNumber}
        </div>

        {/* Status icon */}
        <div className="mb-1">
          {getStatusIcon()}
        </div>

        {showDetails && (
          <>
            {/* Capacity and current occupancy */}
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Users className="w-3 h-3" />
              <span>
                {table.currentGuests?.partySize || 0}/{table.capacity}
              </span>
            </div>

            {/* Time information */}
            {currentReservation && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                <span>
                  {Math.floor((Date.now() - table.currentGuests!.seatedAt.getTime()) / 60000)}m
                </span>
              </div>
            )}

            {/* Table attributes */}
            {table.attributes.length > 0 && (
              <div className="flex gap-1 mt-1">
                {getTableAttributes()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Server section indicator */}
      {table.sectionId && (
        <div 
          className="absolute bottom-0 left-0 w-full h-2 rounded-b-xl opacity-60"
          style={{ backgroundColor: table.serverId ? '#10B981' : '#6B7280' }}
        />
      )}

      {/* Quick action menu (Portal) */}
      {showQuickMenu && typeof document !== 'undefined' && (
        <>
          {createPortal(
            <div 
              className="fixed inset-0 z-[100]" 
              onClick={() => setShowQuickMenu(false)}
              style={{ pointerEvents: 'auto' }}
            />,
            document.body
          )}
          {createPortal(
            <div
              className="fixed z-[110] bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-48 pointer-events-auto"
              style={{ top: menuPosition.top, left: menuPosition.left, transform: 'translateX(-50%)' }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Quick Actions
              </div>
              {quickActions
                .filter(action => action.isEnabled(table))
                .slice(0, 6)
                .map(action => (
                  <button
                    key={action.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.action(table.id);
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    style={{ backgroundColor: `${action.color}10` }}
                  >
                    <span className="text-lg">{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              {quickActions.filter(action => action.isEnabled(table)).length > 6 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTableSelect(table);
                    setShowQuickMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span>More Actions...</span>
                </button>
              )}
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}
