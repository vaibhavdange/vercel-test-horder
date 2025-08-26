import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { CreateTableRequest, UpdateTableRequest, TableOrderUpdateRequest } from '@/types/tables';
import { eventBus } from '@/lib/services/event-bus';

// GET /api/tables - Get all tables
export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      include: {
        area: {
          include: {
            floor: true,
          },
        },
        floor: true,
        orders: {
          where: {
            status: {
              in: ['pending', 'in-process', 'ready', 'completed'],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            orderItems: true,
          },
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { tableNumber: 'asc' }, // Fallback ordering
      ],
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

// POST /api/tables - Create a new table
export async function POST(request: NextRequest) {
  try {
    const data: CreateTableRequest = await request.json();

    // Validate required fields
    if (!data.tableNumber || !data.capacity || !data.areaId || !data.floorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if table number already exists in the same area
    const existingTable = await prisma.table.findFirst({
      where: {
        tableNumber: data.tableNumber,
        areaId: data.areaId,
      },
    });

    if (existingTable) {
      return NextResponse.json(
        { error: 'Table number already exists in this area' },
        { status: 409 }
      );
    }

    const table = await prisma.table.create({
      data: {
        tableNumber: data.tableNumber,
        capacity: data.capacity,
        areaId: data.areaId,
        floorId: data.floorId,
        displayOrder: data.displayOrder || 0, // Use provided displayOrder or default to 0
        status: 'available',
        isActive: true,
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

    // Emit real-time event for table creation
    eventBus.emit("table.updated", { id: table.id, table });
    eventBus.emit("table.available", { id: table.id, table });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
}

// PATCH /api/tables - Update table status
export async function PATCH(request: NextRequest) {
  try {
    const { tableId, status } = await request.json();

    if (!tableId || !status) {
      return NextResponse.json(
        { error: 'Missing tableId or status' },
        { status: 400 }
      );
    }

    const table = await prisma.table.update({
      where: { id: tableId },
      data: { status },
      include: {
        area: {
          include: {
            floor: true,
          },
        },
        floor: true,
      },
    });

    // Emit real-time events for table status changes
    eventBus.emit("table.status.changed", { 
      id: table.id, 
      status: table.status, 
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
    
    // Emit general table update event
    eventBus.emit("table.updated", { id: table.id, table });

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error updating table status:', error);
    return NextResponse.json(
      { error: 'Failed to update table status' },
      { status: 500 }
    );
  }
}

// PUT /api/tables - Update table display order
export async function PUT(request: NextRequest) {
  try {
    const data: TableOrderUpdateRequest = await request.json();

    if (!data.tableOrders || !Array.isArray(data.tableOrders)) {
      return NextResponse.json(
        { error: 'Invalid table orders data' },
        { status: 400 }
      );
    }

    // Update all tables with their new display order
    const updatePromises = data.tableOrders.map(({ id, displayOrder }) =>
      prisma.table.update({
        where: { id },
        data: { displayOrder },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, message: 'Table order updated successfully' });
  } catch (error) {
    console.error('Error updating table order:', error);
    return NextResponse.json(
      { error: 'Failed to update table order' },
      { status: 500 }
    );
  }
}
