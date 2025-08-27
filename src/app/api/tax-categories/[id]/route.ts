import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: taxCategory, error } = await supabase
      .from('tax_categories')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !taxCategory) {
      return NextResponse.json(
        { error: 'Tax category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(taxCategory);
  } catch (error) {
    console.error('Error fetching tax category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax category' },
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
    const { name, description, taxRate } = body;

    if (!name || typeof taxRate !== 'number') {
      return NextResponse.json(
        { error: 'Name and tax rate are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: taxCategory, error } = await supabase
      .from('tax_categories')
      .update({
        name,
        description,
        taxRate: taxRate,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(taxCategory);
  } catch (error) {
    console.error('Error updating tax category:', error);
    return NextResponse.json(
      { error: 'Failed to update tax category' },
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
      .from('tax_categories')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tax category:', error);
    return NextResponse.json(
      { error: 'Failed to delete tax category' },
      { status: 500 }
    );
  }
}
