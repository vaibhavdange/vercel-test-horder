import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taxCategory = await prisma.taxCategory.findUnique({
      where: { id: params.id }
    });

    if (!taxCategory) {
      return NextResponse.json(
        { error: 'Tax category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(taxCategory);
  } catch (error) {
    console.error('Error fetching tax category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, taxRate, isActive } = body;

    // Validate tax rate if provided
    if (taxRate !== undefined && (taxRate < 0 || taxRate > 1)) {
      return NextResponse.json(
        { error: 'Tax rate must be between 0 and 1 (e.g., 0.08 for 8%)' },
        { status: 400 }
      );
    }

    // Check if name is being changed and if it conflicts with existing names
    if (name) {
      const existingCategory = await prisma.taxCategory.findFirst({
        where: {
          name: { equals: name },
          id: { not: params.id }
        }
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: 'Tax category with this name already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (taxRate !== undefined) updateData.taxRate = parseFloat(taxRate);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedTaxCategory = await prisma.taxCategory.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(updatedTaxCategory);
  } catch (error) {
    console.error('Error updating tax category:', error);
    return NextResponse.json(
      { error: 'Failed to update tax category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if tax category is being used by any products
    const productsUsingCategory = await prisma.product.findFirst({
      where: { taxCategoryId: params.id }
    });

    if (productsUsingCategory) {
      return NextResponse.json(
        { error: 'Cannot delete tax category that is being used by products' },
        { status: 400 }
      );
    }

    await prisma.taxCategory.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Tax category deleted successfully' });
  } catch (error) {
    console.error('Error deleting tax category:', error);
    return NextResponse.json(
      { error: 'Failed to delete tax category' },
      { status: 500 }
    );
  }
}
