import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'sales';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const categoryId = searchParams.get('categoryId');
    const customerId = searchParams.get('customerId');
    const paymentMethod = searchParams.get('paymentMethod');
    const status = searchParams.get('status');

    // Calculate date range
    let startDate: Date;
    let endDate: Date = new Date();

    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
    } else {
      // Default to last 30 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    const baseWhere = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    switch (reportType) {
      case 'sales':
        return await generateSalesReport(baseWhere, categoryId || undefined, paymentMethod || undefined, status || undefined);
      
      case 'inventory':
        return await generateInventoryReport(categoryId || undefined);
      
      case 'customers':
        return await generateCustomerReport(baseWhere, customerId || undefined);
      
      case 'financial':
        return await generateFinancialReport(baseWhere, categoryId || undefined);
      
      case 'products':
        return await generateProductReport(baseWhere, categoryId || undefined);
      
      case 'staff':
        return await generateStaffReport(baseWhere);
      
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
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

async function generateSalesReport(where: any, categoryId?: string, paymentMethod?: string, status?: string) {
  // Build where clause
  const salesWhere = { ...where };
  if (categoryId) {
    salesWhere.orderItems = {
      some: {
        product: {
          categoryId: categoryId
        }
      }
    };
  }
  if (paymentMethod) salesWhere.paymentMethod = paymentMethod;
  if (status) salesWhere.status = status;

  // Get sales data
  const orders = await prisma.order.findMany({
    where: salesWhere,
    include: {
      customer: true,
      orderItems: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculate metrics
  const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const totalTax = orders.reduce((sum, order) => sum + order.taxAmount, 0);
  const totalDiscount = orders.reduce((sum, order) => sum + order.discountAmount, 0);

  // Sales by category
  const salesByCategory = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: salesWhere
    },
    _sum: {
      quantity: true,
      totalPrice: true
    }
  });

  // Sales by payment method
  const salesByPaymentMethod = await prisma.order.groupBy({
    by: ['paymentMethod'],
    where: salesWhere,
    _sum: {
      totalAmount: true
    },
    _count: {
      id: true
    }
  });

  // Sales by status
  const salesByStatus = await prisma.order.groupBy({
    by: ['status'],
    where: salesWhere,
    _sum: {
      totalAmount: true
    },
    _count: {
      id: true
    }
  });

  // Daily sales breakdown
  const dailySales = await prisma.order.groupBy({
    by: ['createdAt'],
    where: salesWhere,
    _sum: {
      totalAmount: true
    },
    _count: {
      id: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return NextResponse.json({
    reportType: 'sales',
    dateRange: { start: where.createdAt.gte, end: where.createdAt.lte },
    summary: {
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalOrders,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2))
    },
    orders,
    salesByCategory,
    salesByPaymentMethod,
    salesByStatus,
    dailySales: dailySales.map(day => ({
      date: day.createdAt,
      sales: parseFloat((day._sum.totalAmount || 0).toFixed(2)),
      orders: day._count.id
    }))
  });
}

async function generateInventoryReport(categoryId?: string) {
  const where = categoryId ? { categoryId } : {};

  // Get inventory data
  const products = await prisma.product.findMany({
    where: { ...where, isActive: true },
    include: {
      category: true
    },
    orderBy: {
      stockQuantity: 'asc'
    }
  });

  // Calculate metrics
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, product) => sum + (product.price * product.stockQuantity), 0);
  const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel);
  const outOfStockProducts = products.filter(p => p.stockQuantity === 0);

  // Stock by category
  const stockByCategory = await prisma.product.groupBy({
    by: ['categoryId'],
    where: { ...where, isActive: true },
    _sum: {
      stockQuantity: true
    },
    _count: {
      id: true
    }
  });

  // Top selling products (based on order items)
  const topSellingProducts = await prisma.orderItem.groupBy({
    by: ['productId', 'productName'],
    _sum: {
      quantity: true,
      totalPrice: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: 10
  });

  return NextResponse.json({
    reportType: 'inventory',
    summary: {
      totalProducts,
      totalStockValue: parseFloat(totalStockValue.toFixed(2)),
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length
    },
    products,
    lowStockProducts,
    outOfStockProducts,
    stockByCategory,
    topSellingProducts: topSellingProducts.map(item => ({
      productId: item.productId,
      productName: item.productName,
      totalQuantity: item._sum.quantity || 0,
      totalRevenue: parseFloat((item._sum.totalPrice || 0).toFixed(2))
    }))
  });
}

async function generateCustomerReport(where: any, customerId?: string) {
  const customerWhere = customerId ? { id: customerId } : {};

  // Get customer data
  const customers = await prisma.customer.findMany({
    where: customerWhere,
    include: {
      orders: {
        where,
        include: {
          orderItems: true
        }
      },
      transactions: {
        where
      }
    },
    orderBy: {
      totalPurchases: 'desc'
    }
  });

  // Calculate metrics
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalPurchases, 0);
  const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  // Top customers
  const topCustomers = customers
    .sort((a, b) => b.totalPurchases - a.totalPurchases)
    .slice(0, 10);

  // Customer acquisition over time
  const customerAcquisition = await prisma.customer.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: where.createdAt
    },
    _count: {
      id: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return NextResponse.json({
    reportType: 'customers',
    dateRange: { start: where.createdAt.gte, end: where.createdAt.lte },
    summary: {
      totalCustomers,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageCustomerValue: parseFloat(averageCustomerValue.toFixed(2))
    },
    customers,
    topCustomers,
    customerAcquisition: customerAcquisition.map(day => ({
      date: day.createdAt,
      newCustomers: day._count.id
    }))
  });
}

async function generateFinancialReport(where: any, categoryId?: string) {
  // Get financial data
  const orders = await prisma.order.findMany({
    where,
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    }
  });

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalCost = orders.reduce((sum, order) => {
    const orderCost = order.orderItems.reduce((itemSum, item) => {
      const product = item.product;
      return itemSum + ((product.cost || 0) * item.quantity);
    }, 0);
    return sum + orderCost;
  }, 0);
  const totalTax = orders.reduce((sum, order) => sum + order.taxAmount, 0);
  const totalDiscount = orders.reduce((sum, order) => sum + order.discountAmount, 0);
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalTax;

  // Revenue by category
  const revenueByCategory = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: where
    },
    _sum: {
      totalPrice: true
    }
  });

  // Monthly breakdown
  const monthlyRevenue = await prisma.order.groupBy({
    by: ['createdAt'],
    where,
    _sum: {
      totalAmount: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return NextResponse.json({
    reportType: 'financial',
    dateRange: { start: where.createdAt.gte, end: where.createdAt.lte },
    summary: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      profitMargin: totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0
    },
    revenueByCategory,
    monthlyRevenue: monthlyRevenue.map(month => ({
      date: month.createdAt,
      revenue: parseFloat((month._sum.totalAmount || 0).toFixed(2))
    }))
  });
}

async function generateProductReport(where: any, categoryId?: string) {
  const productWhere = categoryId ? { categoryId } : {};

  // Get product performance data
  const products = await prisma.product.findMany({
    where: { ...productWhere, isActive: true },
    include: {
      category: true,
      orderItems: {
        where: {
          order: where
        }
      }
    }
  });

  // Calculate product metrics
  const productsWithMetrics = products.map(product => {
    const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = product.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const averageOrderSize = totalSold > 0 ? totalSold / product.orderItems.length : 0;

    return {
      ...product,
      totalSold,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageOrderSize: parseFloat(averageOrderSize.toFixed(2)),
      stockTurnover: product.stockQuantity > 0 ? totalSold / product.stockQuantity : 0
    };
  });

  // Sort by performance
  const topPerformers = [...productsWithMetrics]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  const lowPerformers = [...productsWithMetrics]
    .sort((a, b) => a.totalRevenue - b.totalRevenue)
    .slice(0, 10);

  return NextResponse.json({
    reportType: 'products',
    dateRange: { start: where.createdAt.gte, end: where.createdAt.lte },
    summary: {
      totalProducts: products.length,
      totalRevenue: productsWithMetrics.reduce((sum, p) => sum + p.totalRevenue, 0),
      averageProductRevenue: products.length > 0 ? 
        productsWithMetrics.reduce((sum, p) => sum + p.totalRevenue, 0) / products.length : 0
    },
    products: productsWithMetrics,
    topPerformers,
    lowPerformers
  });
}

async function generateStaffReport(where: any) {
  // Get staff performance data
  const staff = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      transactions: {
        where,
        include: {
          order: true
        }
      }
    }
  });

  // Calculate staff metrics
  const staffWithMetrics = staff.map(user => {
    const totalTransactions = user.transactions.length;
    const totalAmount = user.transactions.reduce((sum, txn) => sum + txn.totalAmount, 0);
    const averageTransactionValue = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    return {
      ...user,
      totalTransactions,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      averageTransactionValue: parseFloat(averageTransactionValue.toFixed(2))
    };
  });

  // Sort by performance
  const topPerformers = [...staffWithMetrics]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  return NextResponse.json({
    reportType: 'staff',
    dateRange: { start: where.createdAt.gte, end: where.createdAt.lte },
    summary: {
      totalStaff: staff.length,
      totalTransactions: staffWithMetrics.reduce((sum, s) => sum + s.totalTransactions, 0),
      totalAmount: staffWithMetrics.reduce((sum, s) => sum + s.totalAmount, 0)
    },
    staff: staffWithMetrics,
    topPerformers
  });
}
