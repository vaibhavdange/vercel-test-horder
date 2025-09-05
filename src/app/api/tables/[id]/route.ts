import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: table, error } = await supabase
      .from('tables')
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
      .eq('id', params.id)
      .order('createdAt', { referencedTable: 'orders', ascending: false })
      .single();

    if (error || !table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Keep unpaid orders regardless of completion status, filter out only paid completed orders
    const transformedTable = {
      ...table,
      orders: table.orders?.filter((order: any) => !(order.status === 'completed' && order.paymentStatus === 'paid')) || []
    };

    return NextResponse.json(transformedTable);
  } catch (error) {
    console.error('Error fetching table:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      .update({
        tableNumber: tableNumber,
        capacity: capacity || 4,
        areaId: areaId,
        floorId: floorId,
        status: status || 'available',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
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
      .order('createdAt', { referencedTable: 'orders', ascending: false })
      .single();

    if (error) throw error;

    // Keep unpaid orders regardless of completion status, filter out only paid completed orders
    const transformedTable = {
      ...table,
      orders: table.orders?.filter((order: any) => !(order.status === 'completed' && order.paymentStatus === 'paid')) || []
    };

    return NextResponse.json(transformedTable);
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    );
  }
}
