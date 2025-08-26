import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { CreateStockItemData } from '@/types/menu';

// GET /api/stock-items - Get all stock items with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const stockFilter = searchParams.get('stockFilter');

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (categoryId && categoryId !== 'All') {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let lowStockIds: string[] | undefined;
    if (stockFilter && stockFilter !== 'All') {
      switch (stockFilter) {
        case 'LowStock': {
          // Prisma does not support field-to-field comparison in filters (stockQuantity <= minStockLevel)
          // Use raw SQL to get matching IDs, then fetch with Prisma (to allow include/orderBy)
          const rows = await prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id
            FROM "stock_items"
            WHERE "isActive" = true
              AND "stockQuantity" > 0
              AND "stockQuantity" <= "minStockLevel"
          `;
          lowStockIds = rows.map(r => r.id);
          // If nothing matches, short-circuit to avoid unnecessary query
          if (!lowStockIds.length) {
            return NextResponse.json([]);
          }
          // Constrain further with any other filters
          where.id = { in: lowStockIds };
          break;
        }
        case 'OutOfStock':
          where.stockQuantity = { lte: 0 };
          break;
        case 'InStock':
          where.stockQuantity = { gt: 0 };
          break;
      }
    }

    const stockItems = await prisma.stockItem.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(stockItems);
  } catch (error) {
    console.error('Error fetching stock items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock items' },
      { status: 500 }
    );
  }
}

// POST /api/stock-items - Create a new stock item
export async function POST(request: NextRequest) {
  try {
    const data: CreateStockItemData = await request.json();

    // Validate required fields
    if (!data.name || !data.unit || data.costPerUnit === undefined || data.stockQuantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if stock item name already exists in the same category
    const existingStockItem = await prisma.stockItem.findFirst({
      where: {
        name: data.name,
        categoryId: data.categoryId || null,
        isActive: true,
      },
    });

    if (existingStockItem) {
      return NextResponse.json(
        { error: 'Stock item name already exists in this category' },
        { status: 409 }
      );
    }

    const stockItem = await prisma.stockItem.create({
      data: {
        name: data.name,
        description: data.description,
        unit: data.unit,
        costPerUnit: data.costPerUnit,
        stockQuantity: data.stockQuantity,
        minStockLevel: data.minStockLevel || 0,
        supplier: data.supplier,
        location: data.location,
        categoryId: data.categoryId,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(stockItem, { status: 201 });
  } catch (error) {
    console.error('Error creating stock item:', error);
    return NextResponse.json(
      { error: 'Failed to create stock item' },
      { status: 500 }
    );
  }
}
