import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { CreateAreaRequest, UpdateAreaRequest } from '@/types/tables';

// PUT /api/areas/[id] - Update an area
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data: Partial<CreateAreaRequest & UpdateAreaRequest> = await request.json();

    const existing = await prisma.area.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 });
    }

    const targetFloorId = data.floorId ?? existing.floorId;

    // If updating name or floor, ensure uniqueness within that floor
    if ((data.name && data.name !== existing.name) || (data.floorId && data.floorId !== existing.floorId)) {
      const conflict = await prisma.area.findFirst({
        where: {
          name: data.name ?? existing.name,
          floorId: targetFloorId,
          id: { not: id },
        },
      });
      if (conflict) {
        return NextResponse.json(
          { error: 'Area name already exists in this floor' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.area.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.floorId && { floorId: data.floorId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        floor: true,
        tables: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating area:', error);
    return NextResponse.json(
      { error: 'Failed to update area' },
      { status: 500 }
    );
  }
}

// DELETE /api/areas/[id] - Delete an area
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.area.findUnique({ where: { id }, include: { tables: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 });
    }

    // Prevent delete if area has tables
    if (existing.tables.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete area with existing tables' },
        { status: 400 }
      );
    }

    await prisma.area.delete({ where: { id } });

    return NextResponse.json({ message: 'Area deleted successfully' });
  } catch (error) {
    console.error('Error deleting area:', error);
    return NextResponse.json(
      { error: 'Failed to delete area' },
      { status: 500 }
    );
  }
}


