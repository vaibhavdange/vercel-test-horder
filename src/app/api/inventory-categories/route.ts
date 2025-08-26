import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { CreateInventoryCategoryData } from '@/types/menu';

// GET /api/inventory-categories - Get all inventory categories
export async function GET() {
  try {
    const categories = await prisma.inventoryCategory.findMany({
      where: {
        isActive: true,
      },
      include: {
        stockItems: {
          where: {
            isActive: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching inventory categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory categories' },
      { status: 500 }
    );
  }
}

// POST /api/inventory-categories - Create a new inventory category
export async function POST(request: NextRequest) {
  try {
    const data: CreateInventoryCategoryData = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category name already exists
    const existingCategory = await prisma.inventoryCategory.findFirst({
      where: {
        name: data.name,
        isActive: true,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 }
      );
    }

    const category = await prisma.inventoryCategory.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon || '📦',
        color: data.color || '#3B82F6',
        isActive: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory category:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory category' },
      { status: 500 }
    );
  }
}
