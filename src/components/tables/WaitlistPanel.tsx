'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  Phone, 
  Star, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Plus,
  AlertCircle,
  Crown,
  Gift,
  Search,
  Filter,
  MoreVertical,
  MessageSquare,
  Bell
} from 'lucide-react';
import { WaitlistEntry, TableExtended, Guest } from '@/types/restaurant';

interface WaitlistPanelProps {
  waitlistEntries: WaitlistEntry[];
  availableTables: TableExtended[];
  onSeatParty: (entryId: string, tableId: string) => void;
  onMoveEntry: (entryId: string, direction: 'up' | 'down') => void;
  onRemoveEntry: (entryId: string, reason: 'seated' | 'cancelled' | 'no-show') => void;
  onUpdateEntry: (entryId: string, updates: Partial<WaitlistEntry>) => void;
  onAddEntry: (entry: Omit<WaitlistEntry, 'id' | 'joinedAt'>) => void;
  onNotifyGuest: (entryId: string, method: 'sms' | 'call') => void;
  className?: string;
}

export function WaitlistPanel({
  waitlistEntries,
  availableTables,
  onSeatParty,
  onMoveEntry,
  onRemoveEntry,
  onUpdateEntry,
  onAddEntry,
  onNotifyGuest,
  className = ''
}: WaitlistPanelProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'normal' | 'high' | 'vip'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Add entry form state
  const [newEntry, setNewEntry] = useState({
    guestName: '',
    partySize: 2,
    phoneNumber: '',
    estimatedWaitTime: 15,
    priority: 'normal' as WaitlistEntry['priority'],
    notes: '',
    preferredSeating: '',
    specialRequests: [] as string[]
  });

  // Filter and search waitlist entries
  const filteredEntries = useMemo(() => {
    let filtered = waitlistEntries;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.guestName.toLowerCase().includes(query) ||
        entry.phoneNumber?.includes(query) ||
        entry.notes?.toLowerCase().includes(query)
      );
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(entry => entry.priority === filterPriority);
    }

    // Sort by priority and join time
    return filtered.sort((a, b) => {
      // Priority order: vip > high > normal
      const priorityOrder = { vip: 3, high: 2, normal: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Same priority, sort by join time
      return a.joinedAt.getTime() - b.joinedAt.getTime();
    });
  }, [waitlistEntries, searchQuery, filterPriority]);

  // Get suggested tables for a party
  const getSuggestedTables = (partySize: number, preferredSeating?: string) => {
    return availableTables
      .filter(table => table.capacity >= partySize)
      .filter(table => {
        if (!preferredSeating) return true;
        return table.attributes.some(attr => 
          attr.type.toLowerCase().includes(preferredSeating.toLowerCase())
        );
      })
      .sort((a, b) => {
        // Prefer tables closer to party size
        const aDiff = a.capacity - partySize;
        const bDiff = b.capacity - partySize;
        return aDiff - bDiff;
      })
      .slice(0, 3); // Show top 3 suggestions
  };

  // Calculate actual wait time
  const getActualWaitTime = (joinedAt: Date) => {
    const now = new Date();
    const waitTime = Math.floor((now.getTime() - joinedAt.getTime()) / (1000 * 60));
    return waitTime;
  };

  // Get wait time status
  const getWaitTimeStatus = (entry: WaitlistEntry) => {
    const actualWait = getActualWaitTime(entry.joinedAt);
    const estimatedWait = entry.estimatedWaitTime;
    
    if (actualWait > estimatedWait + 10) return 'overdue';
    if (actualWait > estimatedWait - 5) return 'approaching';
    return 'on-time';
  };

  // Handle add new entry
  const handleAddEntry = () => {
    onAddEntry(newEntry);
    setNewEntry({
      guestName: '',
      partySize: 2,
      phoneNumber: '',
      estimatedWaitTime: 15,
      priority: 'normal',
      notes: '',
      preferredSeating: '',
      specialRequests: []
    });
    setShowAddForm(false);
  };

  // Format wait time display
  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Waitlist</h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
              {filteredEntries.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search guests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="vip">VIP</option>
                  <option value="high">High Priority</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Waitlist entries */}
      <div className="max-h-96 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-1">No guests waiting</p>
            <p className="text-sm">Add guests to the waitlist to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEntries.map((entry, index) => {
              const suggestedTables = getSuggestedTables(entry.partySize, entry.preferredSeating);
              const actualWaitTime = getActualWaitTime(entry.joinedAt);
              const waitTimeStatus = getWaitTimeStatus(entry);
              
              return (
                <div
                  key={entry.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    selectedEntry?.id === entry.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Guest info */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {entry.guestName}
                        </h3>
                        {entry.priority === 'vip' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        {entry.priority === 'high' && (
                          <Star className="w-4 h-4 text-orange-500" />
                        )}
                        {entry.specialRequests && entry.specialRequests.length > 0 && (
                          <Gift className="w-4 h-4 text-pink-500" />
                        )}
                      </div>

                      {/* Party details */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{entry.partySize} guests</span>
                        </div>
                        {entry.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{entry.phoneNumber}</span>
                          </div>
                        )}
                        <div className={`flex items-center gap-1 ${
                          waitTimeStatus === 'overdue' ? 'text-red-600' :
                          waitTimeStatus === 'approaching' ? 'text-yellow-600' : 
                          'text-gray-600'
                        }`}>
                          <Clock className="w-4 h-4" />
                          <span>{formatWaitTime(actualWaitTime)} wait</span>
                          {waitTimeStatus === 'overdue' && (
                            <AlertCircle className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Notes and preferences */}
                      {(entry.notes || entry.preferredSeating) && (
                        <div className="text-xs text-gray-500 mb-2">
                          {entry.preferredSeating && (
                            <span className="inline-block bg-gray-100 rounded px-2 py-1 mr-2">
                              {entry.preferredSeating}
                            </span>
                          )}
                          {entry.notes && (
                            <span className="italic">{entry.notes}</span>
                          )}
                        </div>
                      )}

                      {/* Suggested tables */}
                      {suggestedTables.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {suggestedTables.map(table => (
                            <button
                              key={table.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSeatParty(entry.id, table.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              <span>Table {table.tableNumber}</span>
                              <span className="text-green-600">({table.capacity})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-4">
                      {/* Position controls */}
                      <div className="flex flex-col">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveEntry(entry.id, 'up');
                          }}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveEntry(entry.id, 'down');
                          }}
                          disabled={index === filteredEntries.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Contact buttons */}
                      {entry.phoneNumber && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNotifyGuest(entry.id, 'sms');
                            }}
                            className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                            title="Send SMS"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNotifyGuest(entry.id, 'call');
                            }}
                            className="p-1 hover:bg-green-100 text-green-600 rounded transition-colors"
                            title="Call Guest"
                          >
                            <Phone className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveEntry(entry.id, 'cancelled');
                        }}
                        className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                        title="Remove from waitlist"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add entry modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Waitlist</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name *</label>
                <input
                  type="text"
                  value={newEntry.guestName}
                  onChange={(e) => setNewEntry({ ...newEntry, guestName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter guest name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party Size *</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newEntry.partySize}
                    onChange={(e) => setNewEntry({ ...newEntry, partySize: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Wait (min)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={newEntry.estimatedWaitTime}
                    onChange={(e) => setNewEntry({ ...newEntry, estimatedWaitTime: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newEntry.phoneNumber}
                  onChange={(e) => setNewEntry({ ...newEntry, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newEntry.priority}
                  onChange={(e) => setNewEntry({ ...newEntry, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Seating</label>
                <input
                  type="text"
                  value={newEntry.preferredSeating}
                  onChange={(e) => setNewEntry({ ...newEntry, preferredSeating: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="booth, window, quiet, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Special requests, allergies, etc."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddEntry}
                disabled={!newEntry.guestName.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add to Waitlist
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
