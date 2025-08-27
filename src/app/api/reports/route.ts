import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const supabase = supabaseDb['client'];

    switch (reportType) {
      case 'sales':
        return await generateSalesReport(supabase, dateFrom, dateTo);
      case 'inventory':
        return await generateInventoryReport(supabase);
      case 'customers':
        return await generateCustomersReport(supabase, dateFrom, dateTo);
      default:
        return NextResponse.json(
          { error: 'Invalid report type. Supported types: sales, inventory, customers' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateSalesReport(supabase: any, dateFrom?: string | null, dateTo?: string | null) {
  let query = supabase
    .from('orders')
    .select('*');

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data: orders, error } = await query;

  if (error) throw error;

  const totalSales = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  return NextResponse.json({
    type: 'sales',
    period: { dateFrom, dateTo },
    summary: {
      totalSales,
      totalOrders,
      averageOrderValue,
    },
    data: orders,
  });
}

async function generateInventoryReport(supabase: any) {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('stock_quantity', { ascending: true });

  if (error) throw error;

  const lowStockItems = products.filter((product: any) => 
    product.stock_quantity <= product.min_stock_level
  );

  const outOfStockItems = products.filter((product: any) => 
    product.stock_quantity <= 0
  );

  return NextResponse.json({
    type: 'inventory',
    summary: {
      totalProducts: products.length,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length,
    },
    lowStockItems,
    outOfStockItems,
    allProducts: products,
  });
}

async function generateCustomersReport(supabase: any, dateFrom?: string | null, dateTo?: string | null) {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .order('total_purchases', { ascending: false });

  if (error) throw error;

  const topCustomers = customers.slice(0, 10);
  const totalCustomers = customers.length;
  const totalPurchases = customers.reduce((sum: number, customer: any) => 
    sum + (customer.total_purchases || 0), 0
  );

  return NextResponse.json({
    type: 'customers',
    period: { dateFrom, dateTo },
    summary: {
      totalCustomers,
      totalPurchases,
    },
    topCustomers,
    allCustomers: customers,
  });
}
