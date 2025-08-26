import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { eventBus } from '@/lib/services/event-bus';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, price, cost, stockQuantity, minStockLevel, categoryId, barcode, taxRate, image, thumbnail, extras } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : undefined,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
        minStockLevel: minStockLevel ? parseInt(minStockLevel) : 0,
        categoryId,
        barcode,
        taxRate: taxRate ? parseFloat(taxRate) : 0.0,
        image,
        thumbnail,
        // Replace extras by deleting missing ones and upserting provided list
        extras: extras && Array.isArray(extras) ? {
          deleteMany: {},
          create: extras.map((e: any) => ({
            name: e.name,
            price: parseFloat(e.price || 0),
            stockItemId: e.stockItemId || null,
            isActive: true,
          })),
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

    // Emit real-time event for product update
    eventBus.emit("product.updated", { id: product.id, product });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.product.delete({
      where: { id },
    });

    // Emit real-time event for product deletion
    eventBus.emit("product.updated", { id, deleted: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
