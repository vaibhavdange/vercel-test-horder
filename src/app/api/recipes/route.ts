import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const search = searchParams.get('search');

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const recipes = await prisma.recipe.findMany({
      where,
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
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, productId, servings, items } = body;

    if (!name || !productId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Name, productId, and items are required' },
        { status: 400 }
      );
    }

    // Create recipe with items
    const recipe = await prisma.recipe.create({
      data: {
        name,
        description,
        productId,
        servings: servings || 1,
        items: {
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

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}
