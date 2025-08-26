import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { CreateAreaRequest } from '@/types/tables';

// GET /api/areas - Get all areas
export async function GET() {
  try {
    const areas = await prisma.area.findMany({
      include: {
        floor: true,
        tables: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(areas);
  } catch (error) {
    console.error('Error fetching areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch areas' },
      { status: 500 }
    );
  }
}

// POST /api/areas - Create a new area
export async function POST(request: NextRequest) {
  try {
    const data: CreateAreaRequest = await request.json();

    // Validate required fields
    if (!data.name || !data.floorId) {
      return NextResponse.json(
        { error: 'Area name and floor ID are required' },
        { status: 400 }
      );
    }

    // Check if floor exists
    const floor = await prisma.floor.findUnique({
      where: { id: data.floorId },
    });

    if (!floor) {
      return NextResponse.json(
        { error: 'Floor not found' },
        { status: 404 }
      );
    }

    // Check if area name already exists in the same floor
    const existingArea = await prisma.area.findFirst({
      where: {
        name: data.name,
        floorId: data.floorId,
      },
    });

    if (existingArea) {
      return NextResponse.json(
        { error: 'Area name already exists in this floor' },
        { status: 409 }
      );
    }

    const area = await prisma.area.create({
      data: {
        name: data.name,
        description: data.description,
        floorId: data.floorId,
        isActive: true,
      },
      include: {
        floor: true,
        tables: true,
      },
    });

    return NextResponse.json(area, { status: 201 });
  } catch (error) {
    console.error('Error creating area:', error);
    return NextResponse.json(
      { error: 'Failed to create area' },
      { status: 500 }
    );
  }
}
