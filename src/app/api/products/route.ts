import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { eventBus } from '@/lib/services/event-bus';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    const products = await prisma.product.findMany({
      where: {
        AND: [
          categoryId ? { categoryId: categoryId } : {},
          search ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          } : {},
          { isActive: true }
        ],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        extras: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, cost, stockQuantity, minStockLevel, categoryId, barcode, taxRate, image, thumbnail, extras } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : undefined,
        stockQuantity: stockQuantity || 0,
        minStockLevel: minStockLevel || 0,
        categoryId,
        barcode,
        taxRate: taxRate || 0.0,
        image,
        thumbnail,
        extras: extras && Array.isArray(extras) ? {
          create: extras.map((e: any) => ({
            name: e.name,
            price: parseFloat(e.price || 0),
            stockItemId: e.stockItemId || null,
            isActive: true,
          }))
        } : undefined,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        extras: true,
      },
    });

    // Emit real-time event for product creation
    eventBus.emit("product.updated", { id: product.id, product });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
