'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, Wrench, Eye, Calendar, Users, BarChart3, Clock, TrendingUp, MapPin } from 'lucide-react';
import { Table, TableStatus } from '@/types/tables';

interface TableStatusManagerProps {
  tables: Table[];
  onStatusChange: (tableId: string, status: TableStatus) => void;
  onBulkStatusChange: (tableIds: string[], status: TableStatus) => void;
}

export function TableStatusManager({ tables, onStatusChange, onBulkStatusChange }: TableStatusManagerProps) {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<TableStatus>('available');

  const getStatusCount = (status: TableStatus) => {
    return tables.filter(table => table.status === status).length;
  };

  const getTotalTables = () => tables.length;

  const getAvailablePercentage = () => {
    const available = getStatusCount('available');
    return totalTables > 0 ? Math.round((available / totalTables) * 100) : 0;
  };

  const getOccupancyRate = () => {
    const occupied = getStatusCount('occupied');
    const reserved = getStatusCount('reserved');
    return totalTables > 0 ? Math.round(((occupied + reserved) / totalTables) * 100) : 0;
  };

  const totalTables = getTotalTables();
  const availableTables = getStatusCount('available');
  const occupiedTables = getStatusCount('occupied');
  const reservedTables = getStatusCount('reserved');
  const cleaningTables = getStatusCount('cleaning');
  const unavailableTables = getStatusCount('unavailable');

  const handleTableSelection = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTables.length === totalTables) {
      setSelectedTables([]);
    } else {
      setSelectedTables(tables.map(table => table.id));
    }
  };

  const handleBulkAction = () => {
    if (selectedTables.length > 0) {
      onBulkStatusChange(selectedTables, bulkAction);
      setSelectedTables([]);
    }
  };

  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'occupied':
        return <Eye className="w-5 h-5 text-yellow-600" />;
      case 'reserved':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'cleaning':
        return <Wrench className="w-5 h-5 text-green-600" />;
      case 'unavailable':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'occupied':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'reserved':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'cleaning':
        return 'bg-green-50 border-green-300 text-green-700';
      case 'unavailable':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Table Analytics</h3>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Real-time data</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-800">{availableTables}</div>
            <div className="text-sm text-green-600">Available</div>
            <div className="text-xs text-green-500 mt-1">{getAvailablePercentage()}%</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-800">{occupiedTables}</div>
            <div className="text-sm text-yellow-600">Occupied</div>
            <div className="text-xs text-yellow-500 mt-1">{totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0}%</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-800">{reservedTables}</div>
            <div className="text-sm text-blue-600">Reserved</div>
            <div className="text-xs text-blue-500 mt-1">{totalTables > 0 ? Math.round((reservedTables / totalTables) * 100) : 0}%</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Wrench className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-800">{cleaningTables}</div>
            <div className="text-sm text-green-600">Cleaning</div>
            <div className="text-xs text-green-500 mt-1">{totalTables > 0 ? Math.round((cleaningTables / totalTables) * 100) : 0}%</div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-800">{unavailableTables}</div>
            <div className="text-sm text-red-600">Unavailable</div>
            <div className="text-xs text-red-500 mt-1">{totalTables > 0 ? Math.round((unavailableTables / totalTables) * 100) : 0}%</div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Tables</span>
              <span className="text-lg font-semibold text-gray-900">{totalTables}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Availability Rate</span>
              <span className="text-lg font-semibold text-green-600">{getAvailablePercentage()}%</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Occupancy Rate</span>
              <span className="text-lg font-semibold text-blue-600">{getOccupancyRate()}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900">Bulk Operations</h4>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {selectedTables.length === totalTables ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as TableStatus)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="available">Mark as Available</option>
            <option value="occupied">Mark as Occupied</option>
            <option value="reserved">Mark as Reserved</option>
            <option value="cleaning">Mark as Cleaning</option>
            <option value="unavailable">Mark as Unavailable</option>
          </select>

          <button
            onClick={handleBulkAction}
            disabled={selectedTables.length === 0}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all duration-200
              ${selectedTables.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Apply to {selectedTables.length} Table{selectedTables.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      {/* Table List with Selection */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Table Details</h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`
                flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md
                ${selectedTables.includes(table.id)
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedTables.includes(table.id)}
                  onChange={() => handleTableSelection(table.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all"
                />
                <div>
                  <div className="font-semibold text-gray-900 text-lg">
                    {table.area?.name === 'A/C' ? 'A' : table.area?.name === 'Non A/C' ? 'N' : 'B'}{table.tableNumber}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {table.capacity} seats
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {table.area?.name} • {table.floor?.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(table.status)}`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(table.status)}
                    <span>{table.status}</span>
                  </div>
                </span>
                
                <button
                  onClick={() => onStatusChange(table.id, table.status === 'available' ? 'occupied' : 'available')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors hover:underline"
                >
                  Toggle Status
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
