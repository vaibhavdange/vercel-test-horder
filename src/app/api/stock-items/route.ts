import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const stockFilter = searchParams.get('stockFilter');

    const supabase = supabaseDb['client'];
    let query = supabase
      .from('stock_items')
      .select(`
        *,
        inventory_categories (*)
      `);

    // Apply category filter
    if (categoryId) {
      query = query.eq('categoryId', categoryId);
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply stock status filter (except LowStock which needs special handling)
    if (stockFilter && stockFilter !== 'LowStock') {
      switch (stockFilter) {
        case 'OutOfStock':
          query = query.eq('stockQuantity', 0);
          break;
        case 'InStock':
          query = query.gt('stockQuantity', 0);
          break;
      }
    }

    const { data: stockItems, error } = await query.order('name', { ascending: true });

    if (error) throw error;

    // Apply LowStock filter in JavaScript if needed
    let filteredItems = stockItems || [];
    if (stockFilter === 'LowStock') {
      filteredItems = filteredItems.filter(item => 
        item.stockQuantity > 0 && item.stockQuantity <= item.minStockLevel
      );
    }

    return NextResponse.json(filteredItems);
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
