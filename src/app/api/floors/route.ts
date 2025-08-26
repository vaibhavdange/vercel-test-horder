import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { CreateFloorRequest } from '@/types/tables';

// GET /api/floors - Get all floors
export async function GET() {
  try {
    const floors = await prisma.floor.findMany({
      include: {
        areas: {
          include: {
            tables: true,
          },
        },
        tables: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(floors);
  } catch (error) {
    console.error('Error fetching floors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch floors' },
      { status: 500 }
    );
  }
}

// POST /api/floors - Create a new floor
export async function POST(request: NextRequest) {
  try {
    const data: CreateFloorRequest = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Floor name is required' },
        { status: 400 }
      );
    }

    // Check if floor name already exists
    const existingFloor = await prisma.floor.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingFloor) {
      return NextResponse.json(
        { error: 'Floor name already exists' },
        { status: 409 }
      );
    }

    const floor = await prisma.floor.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: true,
      },
      include: {
        areas: {
          include: {
            tables: true,
          },
        },
        tables: true,
      },
    });

    return NextResponse.json(floor, { status: 201 });
  } catch (error) {
    console.error('Error creating floor:', error);
    return NextResponse.json(
      { error: 'Failed to create floor' },
      { status: 500 }
    );
  }
}
