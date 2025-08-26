'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  Clock, 
  Users, 
  Star, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Calendar,
  RefreshCw,
  Filter,
  Crown,
  Gift
} from 'lucide-react';
import { 
  TableExtended, 
  Reservation, 
  TimeSlot, 
  TimelineView as TimelineViewType,
  DragOperation 
} from '@/types/restaurant';

interface TimelineViewProps {
  tables: TableExtended[];
  reservations: Reservation[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onReservationMove: (reservationId: string, newTableId: string, newStartTime: Date) => void;
  onReservationResize: (reservationId: string, newStartTime: Date, newEndTime: Date) => void;
  onReservationCreate: (tableId: string, startTime: Date, duration: number) => void;
  onReservationSelect: (reservation: Reservation) => void;
  className?: string;
}

export function TimelineView({
  tables,
  reservations,
  selectedDate,
  onDateChange,
  onReservationMove,
  onReservationResize,
  onReservationCreate,
  onReservationSelect,
  className = ''
}: TimelineViewProps) {
  // State
  const [viewStartHour, setViewStartHour] = useState(11); // Restaurant opens at 11 AM
  const [viewEndHour, setViewEndHour] = useState(23); // Restaurant closes at 11 PM
  const [timeInterval, setTimeInterval] = useState(30); // 30-minute intervals
  const [dragOperation, setDragOperation] = useState<DragOperation | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Constants
  const HOUR_WIDTH = 120; // Width of each hour in pixels
  const TABLE_ROW_HEIGHT = 80; // Height of each table row
  const SLOT_WIDTH = HOUR_WIDTH / (60 / timeInterval);

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let hour = viewStartHour; hour <= viewEndHour; hour++) {
      for (let minute = 0; minute < 60; minute += timeInterval) {
        const timestamp = new Date(selectedDate);
        timestamp.setHours(hour, minute, 0, 0);
        
        const isCurrentTime = selectedDate.toDateString() === now.toDateString() &&
          hour === currentHour && 
          Math.abs(minute - currentMinute) < timeInterval;

        const slotReservations = reservations.filter(res => {
          const resStart = new Date(res.startTime);
          const resEnd = new Date(res.endTime);
          return timestamp >= resStart && timestamp < resEnd;
        });

        // Determine if this is a peak time (for highlighting)
        const isPeakTime = (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 20);

        slots.push({
          hour,
          minute,
          timestamp,
          reservations: slotReservations,
          isCurrentTime,
          isPeakTime
        });
      }
    }
    return slots;
  }, [selectedDate, viewStartHour, viewEndHour, timeInterval, reservations]);

  // Get reservations for a specific table
  const getTableReservations = useCallback((tableId: string) => {
    return reservations.filter(res => res.tableId === tableId);
  }, [reservations]);

  // Calculate reservation position and width
  const getReservationStyle = useCallback((reservation: Reservation) => {
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);
    
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    const startOffset = (startHour - viewStartHour) * HOUR_WIDTH + (startMinute / 60) * HOUR_WIDTH;
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
    const width = duration * HOUR_WIDTH;
    
    return {
      left: startOffset,
      width: Math.max(width, SLOT_WIDTH), // Minimum width
      zIndex: selectedReservation?.id === reservation.id ? 20 : 10
    };
  }, [viewStartHour, selectedReservation?.id]);

  // Get reservation color based on status and properties
  const getReservationColor = useCallback((reservation: Reservation) => {
    if (reservation.isVip) return 'bg-yellow-100 border-yellow-400';
    
    switch (reservation.status) {
      case 'confirmed': return 'bg-blue-100 border-blue-400';
      case 'seated': return 'bg-green-100 border-green-400';
      case 'completed': return 'bg-gray-100 border-gray-300';
      case 'cancelled': return 'bg-red-100 border-red-400';
      case 'no-show': return 'bg-red-200 border-red-500';
      default: return 'bg-gray-100 border-gray-300';
    }
  }, []);

  // Drag and drop handlers
  const handleReservationDragStart = (e: React.DragEvent, reservation: Reservation) => {
    setDragOperation({
      type: 'reservation',
      sourceId: reservation.id,
      data: reservation,
      isValid: true
    });
    
    e.dataTransfer.setData('text/plain', reservation.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTimeSlotDrop = (e: React.DragEvent, tableId: string, timestamp: Date) => {
    e.preventDefault();
    
    if (dragOperation?.type === 'reservation') {
      const reservation = dragOperation.data as Reservation;
      const newEndTime = new Date(timestamp.getTime() + reservation.duration * 60 * 1000);
      
      if (reservation.tableId !== tableId) {
        onReservationMove(reservation.id, tableId, timestamp);
      } else {
        onReservationResize(reservation.id, timestamp, newEndTime);
      }
    }
    
    setDragOperation(null);
  };

  const handleTimeSlotDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Time navigation
  const scrollToCurrentTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const scrollPosition = Math.max(0, (currentHour - viewStartHour - 1) * HOUR_WIDTH);
    
    scrollContainerRef.current?.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate);
  };

  // Format helpers
  const formatTime = (hour: number, minute: number) => {
    const time = new Date();
    time.setHours(hour, minute);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: minute === 0 ? undefined : '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Reservation Timeline</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-48 text-center">
                {formatDate(selectedDate)}
              </span>
              <button
                onClick={() => changeDate(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={scrollToCurrentTime}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>Now</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">View Start</label>
                <select
                  value={viewStartHour}
                  onChange={(e) => setViewStartHour(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{formatTime(i, 0)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">View End</label>
                <select
                  value={viewEndHour}
                  onChange={(e) => setViewEndHour(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{formatTime(i, 0)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Interval</label>
                <select
                  value={timeInterval}
                  onChange={(e) => setTimeInterval(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Time header */}
        <div 
          className="sticky top-0 z-20 bg-white border-b border-gray-200"
          style={{ paddingLeft: '200px' }} // Space for table labels
        >
          <div 
            ref={timelineRef}
            className="flex"
            style={{ width: (viewEndHour - viewStartHour + 1) * HOUR_WIDTH }}
          >
            {Array.from({ length: viewEndHour - viewStartHour + 1 }, (_, i) => {
              const hour = viewStartHour + i;
              const isPeakHour = (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 20);
              
              return (
                <div
                  key={hour}
                  className={`flex-shrink-0 border-r border-gray-200 text-center py-3 ${isPeakHour ? 'bg-orange-50' : ''}`}
                  style={{ width: HOUR_WIDTH }}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {formatTime(hour, 0)}
                  </div>
                  {isPeakHour && (
                    <div className="text-xs text-orange-600 font-medium">Peak</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline content */}
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto max-h-96"
        >
          <div className="relative">
            {/* Current time indicator */}
            {selectedDate.toDateString() === new Date().toDateString() && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                style={{
                  left: 200 + (new Date().getHours() - viewStartHour) * HOUR_WIDTH + 
                        (new Date().getMinutes() / 60) * HOUR_WIDTH
                }}
              >
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
              </div>
            )}

            {/* Table rows */}
            {tables.map((table, tableIndex) => {
              const tableReservations = getTableReservations(table.id);
              
              return (
                <div
                  key={table.id}
                  className="flex border-b border-gray-100"
                  style={{ height: TABLE_ROW_HEIGHT }}
                >
                  {/* Table label */}
                  <div 
                    className="flex-shrink-0 bg-gray-50 border-r border-gray-200 p-3 flex items-center"
                    style={{ width: '200px' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        table.status === 'available' ? 'bg-green-400' :
                        table.status === 'occupied' ? 'bg-yellow-400' :
                        table.status === 'reserved' ? 'bg-blue-400' :
                        'bg-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900">
                          Table {table.tableNumber}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{table.capacity} seats</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time slots */}
                  <div 
                    className="relative flex-1"
                    style={{ width: (viewEndHour - viewStartHour + 1) * HOUR_WIDTH }}
                  >
                    {/* Time slot grid */}
                    <div className="absolute inset-0 flex">
                      {timeSlots.map((slot, slotIndex) => (
                        <div
                          key={`${slot.hour}-${slot.minute}`}
                          className={`border-r border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${
                            slot.isCurrentTime ? 'bg-red-50' : 
                            slot.isPeakTime ? 'bg-orange-50' : ''
                          }`}
                          style={{ width: SLOT_WIDTH }}
                          onDrop={(e) => handleTimeSlotDrop(e, table.id, slot.timestamp)}
                          onDragOver={handleTimeSlotDragOver}
                          onDoubleClick={() => onReservationCreate(table.id, slot.timestamp, 120)} // 2 hours default
                        />
                      ))}
                    </div>

                    {/* Reservations */}
                    {tableReservations.map(reservation => {
                      const style = getReservationStyle(reservation);
                      const hasSpecialOccasion = reservation.guest.specialOccasions?.some(
                        occasion => new Date().toDateString() === occasion.date.toDateString()
                      );
                      
                      return (
                        <div
                          key={reservation.id}
                          className={`absolute top-2 bottom-2 border-2 rounded-lg cursor-move transition-all duration-200 ${
                            getReservationColor(reservation)
                          } ${selectedReservation?.id === reservation.id ? 'ring-2 ring-blue-500' : ''}`}
                          style={style}
                          draggable
                          onDragStart={(e) => handleReservationDragStart(e, reservation)}
                          onClick={() => {
                            setSelectedReservation(reservation);
                            onReservationSelect(reservation);
                          }}
                        >
                          <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-900 truncate">
                                  {reservation.guest.name}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{reservation.partySize}</span>
                                </div>
                              </div>
                              <div className="flex gap-1 ml-1">
                                {reservation.isVip && (
                                  <Crown className="w-3 h-3 text-yellow-600" />
                                )}
                                {hasSpecialOccasion && (
                                  <Gift className="w-3 h-3 text-pink-600" />
                                )}
                                {reservation.guest.loyaltyStatus !== 'regular' && (
                                  <Star className="w-3 h-3 text-blue-600" />
                                )}
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              {new Date(reservation.startTime).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                              {reservation.notes && (
                                <div className="truncate mt-1 italic">
                                  {reservation.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 mb-2">
          <strong>Tip:</strong> Double-click time slots to create reservations • Drag reservations to move • Drag edges to resize
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-400 rounded"></div>
            <span>Seated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded"></div>
            <span>VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-3 h-3 text-yellow-600" />
            <span>VIP Guest</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="w-3 h-3 text-pink-600" />
            <span>Special Occasion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
