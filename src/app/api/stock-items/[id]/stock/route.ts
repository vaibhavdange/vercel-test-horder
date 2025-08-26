import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

// PATCH /api/stock-items/[id]/stock - Update stock quantity
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { quantity } = await request.json();

    // Validate input
    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    // Check if stock item exists
    const existingStockItem = await prisma.stockItem.findUnique({
      where: { id },
    });

    if (!existingStockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }

    // Update stock quantity
    const updatedStockItem = await prisma.stockItem.update({
      where: { id },
      data: {
        stockQuantity: quantity,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedStockItem);
  } catch (error) {
    console.error('Error updating stock quantity:', error);
    return NextResponse.json(
      { error: 'Failed to update stock quantity' },
      { status: 500 }
    );
  }
}
