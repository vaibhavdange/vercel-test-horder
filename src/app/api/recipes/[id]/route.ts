import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                name: true,
                icon: true
              }
            }
          }
        },
        items: {
          include: {
            stockItem: {
              select: {
                id: true,
                name: true,
                unit: true,
                stockQuantity: true,
                minStockLevel: true,
                costPerUnit: true
              }
            }
          }
        }
      }
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
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
    const { name, description, servings, items } = body;

    if (!name || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Name and items are required' },
        { status: 400 }
      );
    }

    // Update recipe and its items
    const recipe = await prisma.recipe.update({
      where: { id: params.id },
      data: {
        name,
        description,
        servings: servings || 1,
        items: {
          deleteMany: {}, // Delete all existing items
          create: items.map((item: any) => ({
            stockItemId: item.stockItemId,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes
          }))
        }
      },
      include: {
        product: true,
        items: {
          include: {
            stockItem: true
          }
        }
      }
    });

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.recipe.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { error: 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}
