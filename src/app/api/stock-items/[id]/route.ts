import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { UpdateStockItemData } from '@/types/menu';

// PUT /api/stock-items/[id] - Update a stock item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data: UpdateStockItemData = await request.json();

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

    // If updating name, check for duplicates in the same category
    if (data.name && data.name !== existingStockItem.name) {
      const duplicateStockItem = await prisma.stockItem.findFirst({
        where: {
          name: data.name,
          categoryId: data.categoryId || existingStockItem.categoryId,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateStockItem) {
        return NextResponse.json(
          { error: 'Stock item name already exists in this category' },
          { status: 409 }
        );
      }
    }

    const updatedStockItem = await prisma.stockItem.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        unit: data.unit,
        costPerUnit: data.costPerUnit,
        stockQuantity: data.stockQuantity,
        minStockLevel: data.minStockLevel,
        supplier: data.supplier,
        location: data.location,
        categoryId: data.categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedStockItem);
  } catch (error) {
    console.error('Error updating stock item:', error);
    return NextResponse.json(
      { error: 'Failed to update stock item' },
      { status: 500 }
    );
  }
}

// DELETE /api/stock-items/[id] - Delete a stock item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Check if stock item is used in recipes
    const recipeItems = await prisma.recipeItem.findMany({
      where: { stockItemId: id },
    });

    if (recipeItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete stock item that is used in recipes' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.stockItem.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Stock item deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock item:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock item' },
      { status: 500 }
    );
  }
}
