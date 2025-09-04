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
    query = query.gte('createdAt', dateFrom);
  }
  if (dateTo) {
    query = query.lte('createdAt', dateTo);
  }

  const { data: orders, error } = await query;

  if (error) throw error;

  const totalSales = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const totalTax = orders.reduce((sum: number, order: any) => sum + (order.taxAmount || 0), 0);
  const totalDiscount = orders.reduce((sum: number, order: any) => sum + (order.discountAmount || 0), 0);

  // Group sales by payment method
  const salesByPaymentMethod = orders.reduce((acc: any, order: any) => {
    const method = order.paymentMethod || 'unknown';
    if (!acc[method]) {
      acc[method] = { _sum: { totalAmount: 0 }, _count: { id: 0 } };
    }
    acc[method]._sum.totalAmount += order.totalAmount || 0;
    acc[method]._count.id += 1;
    return acc;
  }, {});

  const salesByPaymentMethodArray = Object.entries(salesByPaymentMethod).map(([method, data]: [string, any]) => ({
    paymentMethod: method,
    _sum: { totalAmount: data._sum.totalAmount },
    _count: { id: data._count.id }
  }));

  return NextResponse.json({
    reportType: 'sales',
    dateRange: { start: dateFrom || '', end: dateTo || '' },
    summary: {
      totalSales,
      totalOrders,
      averageOrderValue,
      totalTax,
      totalDiscount,
    },
    orders: orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
    })),
    salesByPaymentMethod: salesByPaymentMethodArray,
    salesByCategory: [], // TODO: Implement category-based sales
    salesByStatus: [], // TODO: Implement status-based sales
    dailySales: [], // TODO: Implement daily sales breakdown
  });
}

async function generateInventoryReport(supabase: any) {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('stockQuantity', { ascending: true });

  if (error) throw error;

  const lowStockItems = products.filter((product: any) => 
    product.stockQuantity <= product.minStockLevel
  );

  const outOfStockItems = products.filter((product: any) => 
    product.stockQuantity <= 0
  );

  const totalStockValue = products.reduce((sum: number, product: any) => 
    sum + ((product.stockQuantity || 0) * (product.price || 0)), 0
  );

  return NextResponse.json({
    reportType: 'inventory',
    summary: {
      totalProducts: products.length,
      totalStockValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
    },
    products: products.map((product: any) => ({
      id: product.id,
      name: product.name,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      price: product.price,
      category: product.category,
    })),
    lowStockProducts: lowStockItems.map((product: any) => ({
      id: product.id,
      name: product.name,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      category: product.category,
    })),
    outOfStockProducts: outOfStockItems.map((product: any) => ({
      id: product.id,
      name: product.name,
      category: product.category,
    })),
    stockByCategory: [], // TODO: Implement category-based stock
    topSellingProducts: [], // TODO: Implement top selling products
  });
}

async function generateCustomersReport(supabase: any, dateFrom?: string | null, dateTo?: string | null) {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .order('totalPurchases', { ascending: false });

  if (error) throw error;

  const topCustomers = customers.slice(0, 10);
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum: number, customer: any) => 
    sum + (customer.totalPurchases || 0), 0
  );
  const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  return NextResponse.json({
    reportType: 'customers',
    dateRange: { start: dateFrom || '', end: dateTo || '' },
    summary: {
      totalCustomers,
      totalRevenue,
      averageCustomerValue,
    },
    customers: customers.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      totalPurchases: customer.totalPurchases,
      loyaltyPoints: customer.loyaltyPoints || 0,
    })),
    topCustomers: topCustomers.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      totalPurchases: customer.totalPurchases,
    })),
    customerAcquisition: [], // TODO: Implement customer acquisition over time
  });
}
