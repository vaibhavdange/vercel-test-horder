"use client";

import { useState } from "react";
import { useReport, ReportFilters } from "@/hooks/use-reports";
import { useCategories } from "@/hooks/use-categories";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Filter,
  Download,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportFilters['type']>('sales');
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState('');
  
  // Currency formatter
  const { format: formatCurrency } = useCurrency();

  const { data: categories } = useCategories();

  const filters: ReportFilters = {
    type: reportType,
    dateFrom,
    dateTo,
    categoryId: categoryId || undefined,
  };

  const { data: report, isLoading, error } = useReport(filters);

  const reportTypes = [
    { id: 'sales', name: 'Sales Report', icon: TrendingUp, color: 'text-green-600' },
    { id: 'inventory', name: 'Inventory Report', icon: Package, color: 'text-blue-600' },
    { id: 'customers', name: 'Customer Report', icon: Users, color: 'text-purple-600' },
    { id: 'financial', name: 'Financial Report', icon: DollarSign, color: 'text-yellow-600' },
    { id: 'products', name: 'Product Report', icon: BarChart3, color: 'text-indigo-600' },
    { id: 'staff', name: 'Staff Report', icon: Users, color: 'text-pink-600' },
  ];

  const handleExport = () => {
    console.log('Exporting report:', reportType);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p>Failed to generate report</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Report Type Selector */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Select Report Type</h2>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
          </button>
        </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id as ReportFilters['type'])}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    reportType === type.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <Icon className={`h-8 w-8 mx-auto mb-2 ${type.color}`} />
                    <p className="text-sm font-medium text-gray-900">{type.name}</p>
                  </div>
                </button>
              );
            })}
                </div>
              </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Categories</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {reportTypes.find(t => t.id === reportType)?.name} - {format(new Date(dateFrom), 'MMM dd')} to {format(new Date(dateTo), 'MMM dd, yyyy')}
          </h3>
          
          {report ? (
            <div className="space-y-6">
              {/* Render different report types */}
              {report.reportType === 'sales' && <SalesReportDisplay report={report} formatCurrency={formatCurrency} />}
              {report.reportType === 'inventory' && <InventoryReportDisplay report={report} />}
              {report.reportType === 'customers' && <CustomerReportDisplay report={report} />}
              {report.reportType === 'financial' && <FinancialReportDisplay report={report} formatCurrency={formatCurrency} />}
              {report.reportType === 'products' && <ProductReportDisplay report={report} formatCurrency={formatCurrency} />}
              {report.reportType === 'staff' && <StaffReportDisplay report={report} />}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Filter className="h-16 w-16 mx-auto mb-4" />
              <p>Select filters and generate a report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sales Report Display Component
function SalesReportDisplay({ report, formatCurrency }: { report: any, formatCurrency: (value: number) => string }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">Total Sales</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(report.summary.totalSales)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{report.summary.totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-purple-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(report.summary.averageOrderValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-600">Total Tax</p>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(report.summary.totalTax)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-orange-600">Total Discount</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(report.summary.totalDiscount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h4>
        <div className="space-y-3">
          {report.orders.slice(0, 5).map((order: any) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{order.customerName || 'Guest'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                <p className="text-sm text-gray-500 capitalize">{order.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales by Payment Method */}
      {report.salesByPaymentMethod && report.salesByPaymentMethod.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Sales by Payment Method</h4>
          <div className="space-y-3">
            {report.salesByPaymentMethod.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{item.paymentMethod}</p>
                    <p className="text-sm text-gray-500">{item._count.id} orders</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(item._sum.totalAmount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder components for other report types
function InventoryReportDisplay({ report }: { report: any }) {
  return (
    <div className="text-center py-8 text-gray-500">
      <Package className="h-16 w-16 mx-auto mb-4" />
      <p>Inventory report display coming soon</p>
    </div>
  );
}

function CustomerReportDisplay({ report }: { report: any }) {
  return (
    <div className="text-center py-8 text-gray-500">
      <Users className="h-16 w-16 mx-auto mb-4" />
      <p>Customer report display coming soon</p>
    </div>
  );
}

function FinancialReportDisplay({ report, formatCurrency }: { report: any, formatCurrency: (value: number) => string }) {
  return (
    <div className="text-center py-8 text-gray-500">
      <DollarSign className="h-16 w-16 mx-auto mb-4" />
      <p>Financial report display coming soon</p>
    </div>
  );
}

function ProductReportDisplay({ report, formatCurrency }: { report: any, formatCurrency: (value: number) => string }) {
  return (
    <div className="text-center py-8 text-gray-500">
      <BarChart3 className="h-16 w-16 mx-auto mb-4" />
      <p>Product report display coming soon</p>
    </div>
  );
}

function StaffReportDisplay({ report }: { report: any }) {
  return (
    <div className="text-center py-8 text-gray-500">
      <Users className="h-16 w-16 mx-auto mb-4" />
      <p>Staff report display coming soon</p>
    </div>
  );
}
