import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const stockFilter = searchParams.get('stockFilter');

    const where: any = {};

    if (categoryId && categoryId !== 'All') {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { supplier: { contains: search } }
      ];
    }

    if (stockFilter) {
      switch (stockFilter) {
        case 'LowStock':
          where.stockQuantity = { lte: { minStockLevel: true } };
          break;
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
      orderBy: {
        name: 'asc'
      }
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      unit,
      costPerUnit,
      stockQuantity,
      minStockLevel,
      supplier,
      location,
      categoryId
    } = body;

    // Validate required fields
    if (!name || !unit || costPerUnit === undefined || stockQuantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const stockItem = await prisma.stockItem.create({
      data: {
        name,
        description,
        unit,
        costPerUnit: parseFloat(costPerUnit),
        stockQuantity: parseFloat(stockQuantity),
        minStockLevel: parseFloat(minStockLevel || 0),
        supplier,
        location,
        categoryId: categoryId || null,
      },
      include: {
        category: true,
      }
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
