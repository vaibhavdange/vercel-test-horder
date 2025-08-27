import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { adjustment, reason } = body;

    if (typeof adjustment !== 'number') {
      return NextResponse.json(
        { error: 'Adjustment amount is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    
    // Get current stock item
    const { data: stockItem, error: fetchError } = await supabase
      .from('stock_items')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !stockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }

    // Calculate new stock quantity
    const newStockQuantity = stockItem.stockQuantity + adjustment;

    // Update stock quantity
    const { data: updatedStockItem, error: updateError } = await supabase
      .from('stock_items')
      .update({
        stockQuantity: newStockQuantity,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      stockItem: updatedStockItem,
      adjustment,
      previousStock: stockItem.stockQuantity,
      newStock: newStockQuantity,
      reason,
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { quantity } = body;

    if (typeof quantity !== 'number') {
      return NextResponse.json(
        { error: 'Quantity is required and must be a number' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    
    // Get current stock item
    const { data: stockItem, error: fetchError } = await supabase
      .from('stock_items')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !stockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }

    // Update stock quantity
    const { data: updatedStockItem, error: updateError } = await supabase
      .from('stock_items')
      .update({
        stockQuantity: quantity,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedStockItem);
  } catch (error) {
    console.error('Error updating stock quantity:', error);
    return NextResponse.json(
      { error: 'Failed to update stock quantity' },
      { status: 500 }
    );
  }
}
