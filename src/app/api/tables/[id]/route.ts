import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { UpdateTableRequest } from '@/types/tables';
import { eventBus } from '@/lib/services/event-bus';

// PUT /api/tables/[id] - Update a table
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data: UpdateTableRequest = await request.json();

    // Check if table exists
    const existingTable = await prisma.table.findUnique({
      where: { id },
    });

    if (!existingTable) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // If updating table number, check for conflicts
    if (data.tableNumber && data.tableNumber !== existingTable.tableNumber) {
      const conflictingTable = await prisma.table.findFirst({
        where: {
          tableNumber: data.tableNumber,
          areaId: data.areaId || existingTable.areaId,
          id: { not: id },
        },
      });

      if (conflictingTable) {
        return NextResponse.json(
          { error: 'Table number already exists in this area' },
          { status: 409 }
        );
      }
    }

    const table = await prisma.table.update({
      where: { id },
      data: {
        ...(data.tableNumber && { tableNumber: data.tableNumber }),
        ...(data.capacity && { capacity: data.capacity }),
        ...(data.areaId && { areaId: data.areaId }),
        ...(data.floorId && { floorId: data.floorId }),
        ...(data.status && { status: data.status }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
              include: {
          area: {
            include: {
              floor: true,
            },
          },
          floor: true,
        },
    });

    // Emit real-time events for table updates
    if (data.status && data.status !== existingTable.status) {
      eventBus.emit("table.status.changed", { 
        id: table.id, 
        status: table.status, 
        previousStatus: existingTable.status,
        table 
      });
      
      // Emit specific status events
      switch (table.status) {
        case 'occupied':
          eventBus.emit("table.occupied", { id: table.id, table });
          break;
        case 'available':
          eventBus.emit("table.available", { id: table.id, table });
          break;
        case 'reserved':
          eventBus.emit("table.reserved", { id: table.id, table });
          break;
        case 'cleaning':
          eventBus.emit("table.cleaning", { id: table.id, table });
          break;
        case 'unavailable':
          eventBus.emit("table.unavailable", { id: table.id, table });
          break;
      }
    }
    
    // Emit general table update event
    eventBus.emit("table.updated", { id: table.id, table });

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id] - Delete a table
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if table exists
    const existingTable = await prisma.table.findUnique({
      where: { id },
    });

    if (!existingTable) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Check if table has active orders
    const activeOrders = await prisma.order.findFirst({
      where: {
        tableNumber: existingTable.tableNumber,
        status: {
          in: ['pending', 'in-process', 'ready'],
        },
      },
    });

    if (activeOrders) {
      return NextResponse.json(
        { error: 'Cannot delete table with active orders' },
        { status: 400 }
      );
    }

    await prisma.table.delete({
      where: { id },
    });

    // Emit real-time event for table deletion
    eventBus.emit("table.updated", { id, deleted: true });

    return NextResponse.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    );
  }
}
