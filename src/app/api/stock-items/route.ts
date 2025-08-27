import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const supabase = supabaseDb['client'];
    const { data: stockItems, error } = await supabase
      .from('stock_items')
      .select(`
        *,
        inventory_categories (*)
      `)
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json(stockItems || []);
  } catch (error) {
    console.error('Error fetching stock items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, unit, stockQuantity, minStockLevel, cost, supplier, categoryId } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: 'Name and unit are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: stockItem, error } = await supabase
      .from('stock_items')
      .insert({
        id: `stock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        unit,
        costPerUnit: cost || 0,
        stockQuantity: stockQuantity || 0,
        minStockLevel: minStockLevel || 0,
        supplier,
        categoryId: categoryId,
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .select(`
        *,
        inventory_categories (*)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(stockItem, { status: 201 });
  } catch (error) {
    console.error('Error creating stock item:', error);
    return NextResponse.json(
      { error: 'Failed to create stock item' },
      { status: 500 }
    );
  }
}
