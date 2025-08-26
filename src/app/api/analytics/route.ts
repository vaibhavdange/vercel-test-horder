import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  // Skip execution during build time
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

    // Get sales data
    const salesData = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['completed', 'ready'],
        },
        paymentStatus: 'paid',
      },
      _sum: {
        totalAmount: true,
        subtotal: true,
        taxAmount: true,
        discountAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get popular products with product details
    const popularProductsData = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ['completed', 'ready'],
          },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    // Get product details for popular products
    const popularProducts = await Promise.all(
      popularProductsData.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            image: true,
            thumbnail: true,
            categoryId: true,
          },
        });
        
        return {
          productId: item.productId,
          productName: item.productName,
          totalQuantity: item._sum.quantity || 0,
          totalRevenue: item._sum.totalPrice || 0,
          image: product?.image || null,
          thumbnail: product?.thumbnail || null,
          categoryId: product?.categoryId || null,
        };
      })
    );

    // Get inventory status
    const inventoryStatus = await prisma.product.aggregate({
      where: {
        isActive: true,
      },
      _count: {
        id: true,
      },
      _sum: {
        stockQuantity: true,
      },
    });

    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: {
          lte: 10,
        },
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        minStockLevel: true,
        image: true,
        thumbnail: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        stockQuantity: 'asc',
      },
      take: 10,
    });

    // Get daily sales for chart
    const dailySales = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['completed', 'ready'],
        },
        paymentStatus: 'paid',
      },
      _sum: {
        totalAmount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Debug logging
    console.log('Daily sales raw data:', dailySales);
    console.log('Date range:', { startDate, endDate });

    // Calculate metrics
    const totalSales = salesData._sum.totalAmount || 0;
    const totalOrders = salesData._count.id || 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Get table occupancy (assuming orders with table numbers are active)
    const activeTables = await prisma.order.count({
      where: {
        status: {
          in: ['pending', 'in-process'],
        },
        tableNumber: {
          not: null,
        },
        orderType: 'dine-in',
      },
    });

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
        lowStockProducts: lowStockProducts.map(item => ({
          id: item.id,
          name: item.name,
          currentStock: item.stockQuantity,
          minStockLevel: item.minStockLevel,
          category: item.category?.name || 'Uncategorized',
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
