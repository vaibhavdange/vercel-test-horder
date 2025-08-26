'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Users, 
  Star,
  Zap,
  Target,
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { Analytics, TableExtended, Server, Reservation } from '@/types/restaurant';
import { useCurrency } from '@/hooks/useCurrency';

interface AnalyticsOverlayProps {
  analytics: Analytics;
  tables: TableExtended[];
  servers: Server[];
  reservations: Reservation[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onExportData: () => void;
  className?: string;
}

export function AnalyticsOverlay({
  analytics,
  tables,
  servers,
  reservations,
  selectedDate,
  onDateChange,
  onExportData,
  className = ''
}: AnalyticsOverlayProps) {
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'servers' | 'trends'>('overview');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);
  
  // Currency formatter
  const { format } = useCurrency();

  // Computed metrics
  const realTimeMetrics = useMemo(() => {
    const now = new Date();
    const todayReservations = reservations.filter(res => 
      new Date(res.startTime).toDateString() === selectedDate.toDateString()
    );

    const currentlySeated = todayReservations.filter(res => 
      res.status === 'seated' && 
      new Date(res.startTime) <= now && 
      new Date(res.endTime) >= now
    ).length;

    const upcomingReservations = todayReservations.filter(res => 
      res.status === 'confirmed' && 
      new Date(res.startTime) > now &&
      new Date(res.startTime).getTime() - now.getTime() < 2 * 60 * 60 * 1000 // Next 2 hours
    ).length;

    const overdueReservations = todayReservations.filter(res => 
      res.status === 'seated' && 
      new Date(res.endTime) < now
    ).length;

    const vipGuests = todayReservations.filter(res => res.isVip).length;

    return {
      currentlySeated,
      upcomingReservations,
      overdueReservations,
      vipGuests,
      totalReservations: todayReservations.length
    };
  }, [reservations, selectedDate]);

  // Helper function to determine status
  const getStatus = (current: number, target: number, isHigherBetter: boolean): 'good' | 'warning' | 'poor' => {
    if (isHigherBetter) {
      return current >= target ? 'good' : current >= target * 0.8 ? 'warning' : 'poor';
    } else {
      return current <= target ? 'good' : current <= target * 1.2 ? 'warning' : 'poor';
    }
  };

  // Performance indicators
  const performanceIndicators = useMemo(() => {
    const targetUtilization = 85; // 85% target utilization
    const targetTurnover = 90; // 90 minutes target turnover
    const targetRevenue = 1000; // 1000 target revenue per table

    return {
      utilization: {
        current: analytics.tableMetrics.utilizationRate,
        target: targetUtilization,
        status: getStatus(analytics.tableMetrics.utilizationRate, targetUtilization, true)
      },
      turnover: {
        current: analytics.tableMetrics.averageTurnover,
        target: targetTurnover,
        status: getStatus(analytics.tableMetrics.averageTurnover, targetTurnover, false)
      },
      revenue: {
        current: analytics.tableMetrics.revenuePerTable,
        target: targetRevenue,
        status: getStatus(analytics.tableMetrics.revenuePerTable, targetRevenue, true)
      }
    };
  }, [analytics]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Get status color
  const getStatusColor = (status: 'good' | 'warning' | 'poor') => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
    }
  };

  // Format currency - now uses global currency context
  const formatCurrency = (amount: number) => {
    return format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Live Analytics</h2>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live data" />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
            
            <button
              onClick={onExportData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export Data"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex mt-4 space-x-1">
          {(['overview', 'tables', 'servers', 'trends'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Real-time Metrics */}
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('realtime')}
              >
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Real-time Status
                </h3>
                {expandedSections.includes('realtime') ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </div>
              
              {expandedSections.includes('realtime') && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-900">
                        {realTimeMetrics.currentlySeated}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">Currently Seated</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-900">
                        {realTimeMetrics.upcomingReservations}
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">Upcoming (2h)</p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-2xl font-bold text-yellow-900">
                        {realTimeMetrics.overdueReservations}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">Overdue</p>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Star className="w-5 h-5 text-purple-600" />
                      <span className="text-2xl font-bold text-purple-900">
                        {realTimeMetrics.vipGuests}
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 mt-1">VIP Guests</p>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Indicators */}
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('performance')}
              >
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Performance vs Targets
                </h3>
                {expandedSections.includes('performance') ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </div>
              
              {expandedSections.includes('performance') && (
                <div className="space-y-4 mt-4">
                  {/* Utilization */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(performanceIndicators.utilization.status).replace('text-', 'bg-').replace('bg-', 'bg-').split(' ')[0]}`} />
                      <span className="font-medium">Table Utilization</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatPercentage(performanceIndicators.utilization.current)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Target: {formatPercentage(performanceIndicators.utilization.target)}
                      </div>
                    </div>
                  </div>

                  {/* Turnover */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(performanceIndicators.turnover.status).replace('text-', 'bg-').replace('bg-', 'bg-').split(' ')[0]}`} />
                      <span className="font-medium">Avg Turnover Time</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {Math.round(performanceIndicators.turnover.current)}m
                      </div>
                      <div className="text-sm text-gray-500">
                        Target: {performanceIndicators.turnover.target}m
                      </div>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(performanceIndicators.revenue.status).replace('text-', 'bg-').replace('bg-', 'bg-').split(' ')[0]}`} />
                      <span className="font-medium">Revenue per Table</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatCurrency(performanceIndicators.revenue.current)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Target: {formatCurrency(performanceIndicators.revenue.target)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Table Performance</h3>
            
            {/* Busy zones */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Busiest Areas</h4>
              <div className="space-y-2">
                {analytics.busyZones.map(zone => (
                  <div key={zone.areaId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{zone.areaName}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        {formatPercentage(zone.occupancyRate)} occupied
                      </span>
                      <span className="text-gray-600">
                        {Math.round(zone.averageWaitTime)}m wait
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table status breakdown */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Status Breakdown</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.tableMetrics.availableTables}
                  </div>
                  <div className="text-sm text-green-700">Available</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analytics.tableMetrics.occupiedTables}
                  </div>
                  <div className="text-sm text-yellow-700">Occupied</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'servers' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Server Performance</h3>
            
            <div className="space-y-3">
              {analytics.serverMetrics.topPerformers.slice(0, 5).map(server => (
                <div key={server.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${server.shift.isWorking ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="font-medium">{server.name}</span>
                    <span className="text-sm text-gray-500">({server.experience})</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {server.currentTables.length}/{server.maxTables} tables
                    </span>
                    <span className="text-gray-600">
                      {formatCurrency(server.performance.totalSales)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{server.performance.customerRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Time-based Trends</h3>
            
            {/* Hourly breakdown */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Today's Hourly Data</h4>
              <div className="space-y-2">
                {analytics.timeSlotData.slice(0, 8).map(slot => (
                  <div key={slot.hour} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">
                      {new Date().setHours(slot.hour, 0, 0, 0) && 
                       new Date(new Date().setHours(slot.hour, 0, 0, 0)).toLocaleTimeString('en-US', { 
                         hour: 'numeric', 
                         hour12: true 
                       })}
                    </span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        {formatPercentage(slot.occupancyRate)}
                      </span>
                      <span className="text-gray-600">
                        {Math.round(slot.waitTime)}m wait
                      </span>
                      <span className="text-gray-600">
                        {formatCurrency(slot.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>Data refreshes every 30 seconds</span>
        </div>
      </div>
    </div>
  );
}
