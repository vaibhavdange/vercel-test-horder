"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, DollarSign, Users, BarChart3, Eye, Plus, Table, Package, AlertTriangle } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useAnalytics } from "@/hooks/use-analytics";
import { useCategories } from "@/hooks/use-categories";
import { format } from "date-fns";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import AnimatedProgressBar from "@/components/ui/AnimatedProgressBar";
import { SalesAreaChart } from "@/components/ui/SalesAreaChart";
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";

export default function DashboardPage() {
  const [period, setPeriod] = useState('month');
  const [showCounters, setShowCounters] = useState(false);
  const { data: analytics, isLoading, error } = useAnalytics(period);
  const { data: categories = [] } = useCategories();
  const { format } = useCurrency();
  
  // Show counters after 1 second delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCounters(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Get appropriate fallback icon based on category
  const getFallbackIcon = (categoryId: string | null) => {
    if (!categoryId) return "🍽️";
    
    const category = categories.find((cat: any) => cat.id === categoryId);
    if (!category) return "🍽️";
    
    const categoryName = category.name.toLowerCase();
    if (categoryName.includes('pizza')) return "🍕";
    if (categoryName.includes('burger')) return "🍔";
    if (categoryName.includes('chicken')) return "🍗";
    if (categoryName.includes('bakery')) return "🧁";
    if (categoryName.includes('beverage')) return "🥤";
    if (categoryName.includes('pasta')) return "🍝";
    if (categoryName.includes('salad')) return "🥗";
    if (categoryName.includes('dessert')) return "🍰";
    if (categoryName.includes('seafood')) return "🦐";
    return category.icon || "🍽️";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-process':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
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
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>Failed to load dashboard data</p>
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
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
          <div className="flex items-center justify-between">
            {['day', 'week', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  period === p
                    ? 'text-green-600 bg-green-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Sales */}
          <Card className="@container/card text-lime-700 bg-lime-50">
            <CardHeader className="relative">
              <CardDescription>
                {period === 'day' ? 'Today\'s Sales' : 
                 period === 'week' ? 'This Week\'s Sales' :
                 period === 'month' ? 'This Month\'s Sales' : 'This Year\'s Sales'}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-lime-700">
                {showCounters ? (
                  <span>
                    {format(analytics?.metrics.totalSales || 0)}
                  </span>
                ) : (
                  <span>{format(0)}</span>
                )}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="border-lime-300 text-lime-700">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{((analytics?.metrics?.totalSales || 0) / 1000 * 100).toFixed(1)}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-lime-700">
                {period === 'day' ? 'Today\'s performance' : 
                 period === 'week' ? 'Weekly performance' :
                 period === 'month' ? 'Monthly performance' : 'Yearly performance'} <TrendingUp className="size-4" />
              </div>
              <div className="text-lime-600">
                {analytics?.metrics.totalOrders || 0} orders processed
              </div>
            </CardFooter>
          </Card>

          {/* Average Order Value */}
          <Card className="@container/card text-blue-700 bg-blue-50">
            <CardHeader className="relative">
              <CardDescription>Average Order Value</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-blue-700">
                {showCounters ? (
                  <span>
                    {format(analytics?.metrics.averageOrderValue || 0)}
                  </span>
                ) : (
                  <span>{format(0)}</span>
                )}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{((analytics?.metrics?.averageOrderValue || 0) / 25 * 100).toFixed(1)}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-blue-700">
                Trending up this month <TrendingUp className="size-4" />
              </div>
              <div className="text-blue-600">
                Revenue per transaction
              </div>
            </CardFooter>
          </Card>

          {/* Table Occupancy */}
          <Card className="@container/card text-purple-700 bg-purple-50">
            <CardHeader className="relative">
              <CardDescription>Active Tables</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-purple-700">
                {showCounters ? (
                  <AnimatedCounter 
                    value={analytics?.metrics.activeTables || 0} 
                    duration={3000}
                  />
                ) : (
                  <span>0</span>
                )}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="border-purple-300 text-purple-700">
                  <Users className="h-3 w-3 mr-1" />
                  +{((analytics?.metrics?.activeTables || 0) / 10 * 100).toFixed(1)}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-purple-700">
                Trending up this month <Users className="size-4" />
              </div>
              <div className="text-purple-600">
                Table occupancy status
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Sales Chart */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm font-medium text-green-600 bg-green-100 rounded-lg">
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
              <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center space-x-1">
                <BarChart3 className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* New Area Chart */}
          <div className="h-64">
            <SalesAreaChart 
              data={analytics?.chartData?.dailySales || []}
              period={period}
            />
          </div>
        </div>

        {/* Popular Products and Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Products */}
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Popular Products</h3>
              <Link href="/dashboard/menu" className="text-sm text-green-600 hover:text-green-700 font-medium">
                See All
              </Link>
            </div>
            <div className="space-y-4">
              {analytics?.popularProducts.slice(0, 4).map((product, index) => (
                <div key={product.productId} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                    {product.thumbnail || product.image ? (
                      <OptimizedImage
                        src={product.thumbnail || product.image!}
                        alt={product.productName}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        priority={false}
                        fallbackIcon={<div className="text-2xl opacity-60">{getFallbackIcon(product.categoryId)}</div>}
                      />
                    ) : (
                      <div className="text-2xl opacity-60">{getFallbackIcon(product.categoryId)}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.productName}</h4>
                    <p className="text-sm text-gray-500">
                      Sold: {showCounters ? (
                        <AnimatedCounter 
                          value={product.totalQuantity} 
                          suffix=" units"
                          duration={3000}
                        />
                      ) : (
                        <span>0 units</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {showCounters ? (
                        <span>
                          {format(product.totalRevenue)}
                        </span>
                      ) : (
                        <span>{format(0)}</span>
                      )}
                    </p>
                    <p className="text-xs text-green-600">Top Seller</p>
                  </div>
                </div>
              ))}
              {(!analytics?.popularProducts || analytics.popularProducts.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No sales data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
              <Link href="/dashboard/inventory" className="text-sm text-red-600 hover:text-red-700 font-medium">
                Manage
              </Link>
            </div>
            <div className="space-y-4">
              {analytics?.inventory.lowStockProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="h-12 w-12 bg-red-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {product.thumbnail || product.image ? (
                      <OptimizedImage
                        src={product.thumbnail || product.image!}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        priority={false}
                        fallbackIcon={<div className="text-2xl opacity-60">{getFallbackIcon(product.categoryId)}</div>}
                      />
                    ) : (
                      <div className="text-2xl opacity-60">{getFallbackIcon(product.categoryId)}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {showCounters ? (
                        <AnimatedCounter 
                          value={product.currentStock} 
                          suffix=" left"
                          duration={3000}
                        />
                      ) : (
                        <span>0 left</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Min: {product.minStockLevel}</p>
                  </div>
                </div>
              ))}
              {(!analytics?.inventory.lowStockProducts || analytics.inventory.lowStockProducts.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <p>All products well stocked</p>
                </div>
              )}
            </div>
          </div>
        </div>

        

        {/* Order Status Summary */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics?.ordersByStatus.map((status) => (
              <div key={status.status} className="text-center p-4 rounded-lg bg-gray-50">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${getStatusColor(status.status)}`}>
                  {status.status}
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {showCounters ? (
                    <AnimatedCounter 
                      value={status.count} 
                      duration={3000}
                    />
                  ) : (
                    <span>0</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">orders</p>
            </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
