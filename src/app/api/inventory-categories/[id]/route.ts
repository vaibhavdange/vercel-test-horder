import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { UpdateInventoryCategoryData } from '@/types/menu';

// PUT /api/inventory-categories/[id] - Update an inventory category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data: UpdateInventoryCategoryData = await request.json();

    // Check if category exists
    const existingCategory = await prisma.inventoryCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Inventory category not found' },
        { status: 404 }
      );
    }

    // If updating name, check for duplicates
    if (data.name && data.name !== existingCategory.name) {
      const duplicateCategory = await prisma.inventoryCategory.findFirst({
        where: {
          name: data.name,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'Category name already exists' },
          { status: 409 }
        );
      }
    }

    const updatedCategory = await prisma.inventoryCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating inventory category:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory category' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory-categories/[id] - Delete an inventory category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if category exists
    const existingCategory = await prisma.inventoryCategory.findUnique({
      where: { id },
      include: {
        stockItems: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Inventory category not found' },
        { status: 404 }
      );
    }

    // Check if category has active stock items
    if (existingCategory.stockItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing stock items' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.inventoryCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory category:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory category' },
      { status: 500 }
    );
  }
}
