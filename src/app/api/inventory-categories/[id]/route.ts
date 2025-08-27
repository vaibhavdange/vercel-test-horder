import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: category, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !category) {
      return NextResponse.json(
        { error: 'Inventory category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching inventory category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory category' },
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
      .update({
        name,
        description,
        icon: icon || '📦',
        color: color || '#3B82F6',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating inventory category:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory category' },
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
      .from('inventory_categories')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inventory category:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory category' },
      { status: 500 }
    );
  }
}
