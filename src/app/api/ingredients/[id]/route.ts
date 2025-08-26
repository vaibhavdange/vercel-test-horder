import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const stockItem = await prisma.stockItem.update({
      where: { id: params.id },
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

    return NextResponse.json(stockItem);
  } catch (error) {
    console.error('Error updating stock item:', error);
    return NextResponse.json(
      { error: 'Failed to update stock item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if stock item is used in any recipes
    const recipeItems = await prisma.recipeItem.findMany({
      where: { stockItemId: params.id }
    });

    if (recipeItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete stock item that is used in recipes' },
        { status: 400 }
      );
    }

    await prisma.stockItem.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Stock item deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock item:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock item' },
      { status: 500 }
    );
  }
}
