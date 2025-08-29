import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const tables = await supabaseDb.getTables();
    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableNumber, capacity, areaId, floorId, status, position } = body;

    if (!tableNumber) {
      return NextResponse.json(
        { error: 'Table number is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: table, error } = await supabase
      .from('tables')
      .insert({
        id: `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tableNumber: tableNumber,
        capacity: capacity || 4,
        areaId: areaId,
        floorId: floorId,
        status: status || 'available',
        displayOrder: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select(`
        *,
        areas (*),
        floors (*),
        orders (
          id,
          orderNumber,
          status,
          paymentStatus,
          totalAmount,
          createdAt,
          orderType,
          tableId,
          tableNumber,
          customerName,
          customerPhone,
          customerId,
          order_items (
            id,
            productId,
            productName,
            unitPrice,
            quantity,
            totalPrice,
            customizationNotes
          )
        )
      `)
      .single();

    if (error) throw error;
    
    // Transform the data to match frontend expectations and filter out completed orders
    const transformedTable = {
      ...table,
      area: table.areas,
      floor: table.floors,
      // Keep unpaid orders regardless of completion status, filter out only paid completed orders
      orders: table.orders?.filter((order: any) => !(order.status === 'completed' && order.paymentStatus === 'paid')) || [],
      // Remove the plural versions to avoid confusion
      areas: undefined,
      floors: undefined
    };
    
    return NextResponse.json(transformedTable, { status: 201 });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, status } = body;

    if (!tableId || !status) {
      return NextResponse.json(
        { error: 'Table ID and status are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: table, error } = await supabase
      .from('tables')
      .update({
        status: status,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', tableId)
      .select(`
        *,
        areas (*),
        floors (*),
        orders (
          id,
          orderNumber,
          status,
          paymentStatus,
          totalAmount,
          createdAt,
          orderType,
          tableId,
          tableNumber,
          customerName,
          customerPhone,
          customerId,
          order_items (
            id,
            productId,
            productName,
            unitPrice,
            quantity,
            totalPrice,
            customizationNotes
          )
        )
      `)
      .single();

    if (error) throw error;
    
    // Transform the data to match frontend expectations and filter out completed orders
    const transformedTable = {
      ...table,
      area: table.areas,
      floor: table.floors,
      // Keep unpaid orders regardless of completion status, filter out only paid completed orders
      orders: table.orders?.filter((order: any) => !(order.status === 'completed' && order.paymentStatus === 'paid')) || [],
      // Remove the plural versions to avoid confusion
      areas: undefined,
      floors: undefined
    };
    
    return NextResponse.json(transformedTable);
  } catch (error) {
    console.error('Error updating table status:', error);
    return NextResponse.json(
      { error: 'Failed to update table status' },
      { status: 500 }
    );
  }
}
