import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  // Skip execution during build time when Supabase URL is missing
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Service not available during build' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Calculate date range based on period
    let startDate: Date;
    let endDate: Date = new Date();

    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
    } else {
      switch (period) {
        case 'day':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
      }
    }

    const supabase = createServerSupabaseClient();

    // Fetch orders for sales calculations (completed/ready and paid)
    const { data: paidOrders, error: paidOrdersError } = await supabase
      .from('orders')
      .select('id,totalAmount,subtotal,taxAmount,discountAmount,createdAt')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
      .in('status', ['completed', 'ready'])
      .eq('paymentStatus', 'paid')
      .limit(10000);

    if (paidOrdersError) throw paidOrdersError;

    const salesData = {
      _sum: {
        totalAmount: paidOrders?.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0) ?? 0,
        subtotal: paidOrders?.reduce((sum, o) => sum + (o.subtotal ?? 0), 0) ?? 0,
        taxAmount: paidOrders?.reduce((sum, o) => sum + (o.taxAmount ?? 0), 0) ?? 0,
        discountAmount: paidOrders?.reduce((sum, o) => sum + (o.discountAmount ?? 0), 0) ?? 0,
      },
      _count: {
        id: paidOrders?.length ?? 0,
      },
    } as const;

    // Orders by status (all orders in range)
    const { data: rangeOrders, error: rangeOrdersError } = await supabase
      .from('orders')
      .select('id,status,createdAt')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
      .limit(20000);
    if (rangeOrdersError) throw rangeOrdersError;

    const statusToCount: Record<string, number> = {};
    for (const o of rangeOrders ?? []) {
      const key = o.status ?? 'unknown';
      statusToCount[key] = (statusToCount[key] ?? 0) + 1;
    }
    const ordersByStatus = Object.entries(statusToCount).map(([status, count]) => ({
      status,
      _count: { id: count },
    }));

    // Popular products based on order_items within range (approximation)
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('productId,productName,quantity,totalPrice,createdAt')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
      .limit(20000);
    if (itemsError) throw itemsError;

    const productAgg = new Map<string, { productId: string; productName: string; quantity: number; revenue: number }>();
    for (const it of orderItems ?? []) {
      const id = it.productId as string;
      const name = (it as any).productName as string;
      if (!id) continue;
      const existing = productAgg.get(id) ?? { productId: id, productName: name ?? 'Unknown', quantity: 0, revenue: 0 };
      existing.quantity += (it.quantity ?? 0);
      existing.revenue += (it.totalPrice ?? 0);
      productAgg.set(id, existing);
    }
    const popularProductsData = Array.from(productAgg.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(p => ({
        productId: p.productId,
        productName: p.productName,
        _sum: { quantity: p.quantity, totalPrice: p.revenue },
      }));

    // Get product details for popular products
    const popularProductIds = popularProductsData.map(p => p.productId);
    const { data: popularDetails } = popularProductIds.length > 0
      ? await supabase.from('products').select('id,image,thumbnail,categoryId').in('id', popularProductIds)
      : { data: [] as any };

    const detailsById = new Map<string, any>();
    for (const p of (popularDetails as any[]) ?? []) {
      detailsById.set(p.id, p);
    }

    const popularProducts = popularProductsData.map(item => {
      const product = detailsById.get(item.productId) || {};
      return {
        productId: item.productId,
        productName: item.productName,
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: item._sum.totalPrice || 0,
        image: product.image ?? null,
        thumbnail: product.thumbnail ?? null,
        categoryId: product.categoryId ?? null,
      };
    });

    // Inventory status
    const { data: activeProducts, error: activeProductsError } = await supabase
      .from('products')
      .select('id,stockQuantity')
      .eq('isActive', true)
      .limit(20000);
    if (activeProductsError) throw activeProductsError;
    const inventoryStatus = {
      _count: { id: activeProducts?.length ?? 0 },
      _sum: { stockQuantity: activeProducts?.reduce((sum, p) => sum + (p.stockQuantity ?? 0), 0) ?? 0 },
    } as const;

    const { data: lowStockProductsData } = await supabase
      .from('products')
      .select('id,name,stockQuantity,minStockLevel,image,thumbnail,categoryId')
      .eq('isActive', true)
      .lte('stockQuantity', 10)
      .order('stockQuantity', { ascending: true })
      .limit(10);

    // Fetch category names for low stock items
    const lowCategoryIds = Array.from(new Set((lowStockProductsData ?? []).map(p => p.categoryId).filter(Boolean))) as string[];
    const { data: lowCategories } = lowCategoryIds.length > 0
      ? await supabase.from('categories').select('id,name').in('id', lowCategoryIds)
      : { data: [] as any };
    const categoryNameById = new Map<string, string>();
    for (const c of (lowCategories as any[]) ?? []) categoryNameById.set(c.id, c.name);

    // Get daily sales for chart
    // Daily sales computed from paidOrders
    const dailyMap = new Map<string, number>();
    for (const o of paidOrders ?? []) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + (o.totalAmount ?? 0));
    }
    const dailySales = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, amt]) => ({
      createdAt: date,
      _sum: { totalAmount: amt },
    }));

    // Debug logging
    console.log('Daily sales raw data:', dailySales);
    console.log('Date range:', { startDate, endDate });

    // Calculate metrics
    const totalSales = salesData._sum.totalAmount || 0;
    const totalOrders = salesData._count.id || 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Active tables count
    const { count: activeTables } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'in-process'])
      .not('tableNumber', 'is', null)
      .eq('orderType', 'dine-in');

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      metrics: {
        totalSales: parseFloat(totalSales.toFixed(2)),
        totalOrders,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        totalTax: parseFloat((salesData._sum.taxAmount || 0).toFixed(2)),
        totalDiscount: parseFloat((salesData._sum.discountAmount || 0).toFixed(2)),
        activeTables,
      },
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count.id,
      })),
      popularProducts: popularProducts.map(item => ({
        productId: item.productId,
        productName: item.productName,
        totalQuantity: item.totalQuantity,
        totalRevenue: parseFloat(item.totalRevenue.toFixed(2)),
        image: item.image,
        thumbnail: item.thumbnail,
        categoryId: item.categoryId,
      })),
      inventory: {
        totalProducts: inventoryStatus._count.id || 0,
        totalStock: inventoryStatus._sum.stockQuantity || 0,
        lowStockProducts: (lowStockProductsData ?? []).map(item => ({
          id: item.id,
          name: item.name,
          currentStock: item.stockQuantity,
          minStockLevel: item.minStockLevel,
          category: categoryNameById.get(item.categoryId as string) || 'Uncategorized',
          image: item.image || null,
          thumbnail: item.thumbnail || null,
          categoryId: item.categoryId || null,
        })),
      },
      chartData: {
        dailySales: dailySales.map(item => ({
          date: item.createdAt,
          sales: parseFloat((item._sum.totalAmount || 0).toFixed(2)),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
