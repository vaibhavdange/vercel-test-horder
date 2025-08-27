import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const supabase = supabaseDb['client'];
    const { data: ingredients, error } = await supabase
      .from('stock_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json(ingredients || []);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ingredients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, unit, costPerUnit, stockQuantity, minStockLevel, supplier } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: 'Name and unit are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: ingredient, error } = await supabase
      .from('stock_items')
      .insert({
        id: `ingredient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        unit,
        costPerUnit: costPerUnit || 0,
        stockQuantity: stockQuantity || 0,
        minStockLevel: minStockLevel || 0,
        supplier,
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(ingredient, { status: 201 });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json(
      { error: 'Failed to create ingredient' },
      { status: 500 }
    );
  }
}
