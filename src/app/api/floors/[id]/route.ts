import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { CreateFloorRequest, UpdateFloorRequest } from '@/types/tables';

// PUT /api/floors/[id] - Update a floor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data: Partial<CreateFloorRequest & UpdateFloorRequest> = await request.json();

    const existing = await prisma.floor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    // If updating name, ensure uniqueness
    if (data.name && data.name !== existing.name) {
      const conflict = await prisma.floor.findFirst({ where: { name: data.name } });
      if (conflict) {
        return NextResponse.json(
          { error: 'Floor name already exists' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.floor.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        areas: { include: { tables: true } },
        tables: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating floor:', error);
    return NextResponse.json(
      { error: 'Failed to update floor' },
      { status: 500 }
    );
  }
}

// DELETE /api/floors/[id] - Delete a floor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.floor.findUnique({ where: { id }, include: { tables: true, areas: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    // Optional safety: prevent delete if there are tables
    if (existing.tables.length > 0 || existing.areas.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete floor with existing areas or tables' },
        { status: 400 }
      );
    }

    await prisma.floor.delete({ where: { id } });

    return NextResponse.json({ message: 'Floor deleted successfully' });
  } catch (error) {
    console.error('Error deleting floor:', error);
    return NextResponse.json(
      { error: 'Failed to delete floor' },
      { status: 500 }
    );
  }
}


