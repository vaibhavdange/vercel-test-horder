import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: stockItem, error } = await supabase
      .from('stock_items')
      .select(`
        *,
        inventory_categories (*)
      `)
      .eq('id', params.id)
      .single();

    if (error || !stockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stockItem);
  } catch (error) {
    console.error('Error fetching stock item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock item' },
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
    const { name, description, unit, stockQuantity, minStockLevel, costPerUnit, supplier, categoryId } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: 'Name and unit are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    
    // Build update object with only provided fields
    const updateData: any = {
      name,
      description,
      unit,
      costPerUnit: costPerUnit || 0,
      stockQuantity: stockQuantity || 0,
      minStockLevel: minStockLevel || 0,
      supplier,
      updatedAt: new Date().toISOString(),
    };

    // Only include categoryId if it's provided
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    const { data: stockItem, error } = await supabase
      .from('stock_items')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        inventory_categories (*)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(stockItem);
  } catch (error) {
    console.error('Error updating stock item:', error);
    return NextResponse.json(
      { error: 'Failed to update stock item' },
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
      .from('stock_items')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stock item:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock item' },
      { status: 500 }
    );
  }
}
