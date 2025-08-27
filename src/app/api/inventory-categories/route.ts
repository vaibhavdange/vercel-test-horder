import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const supabase = supabaseDb['client'];
    const { data: categories, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json(categories || []);
  } catch (error) {
    console.error('Error fetching inventory categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: category, error } = await supabase
      .from('inventory_categories')
      .insert({
        id: `inv_cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        icon: icon || '📦',
        color: color || '#3B82F6',
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory category:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory category' },
      { status: 500 }
    );
  }
}
