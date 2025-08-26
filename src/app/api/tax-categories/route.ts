import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const taxCategories = await prisma.taxCategory.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(taxCategories);
  } catch (error) {
    console.error('Error fetching tax categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, taxRate } = body;

    if (!name || taxRate === undefined) {
      return NextResponse.json(
        { error: 'Name and tax rate are required' },
        { status: 400 }
      );
    }

    // Validate tax rate (should be between 0 and 1)
    if (taxRate < 0 || taxRate > 1) {
      return NextResponse.json(
        { error: 'Tax rate must be between 0 and 1 (e.g., 0.08 for 8%)' },
        { status: 400 }
      );
    }

    // Check if tax category with same name already exists
    const existingCategory = await prisma.taxCategory.findFirst({
      where: { name: { equals: name } }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Tax category with this name already exists' },
        { status: 409 }
      );
    }

    const taxCategory = await prisma.taxCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        taxRate: parseFloat(taxRate)
      }
    });

    return NextResponse.json(taxCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating tax category:', error);
    return NextResponse.json(
      { error: 'Failed to create tax category' },
      { status: 500 }
    );
  }
}
