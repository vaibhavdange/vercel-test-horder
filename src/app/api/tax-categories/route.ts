import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const supabase = supabaseDb['client'];
    const { data: taxCategories, error } = await supabase
      .from('tax_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json(taxCategories || []);
  } catch (error) {
    console.error('Error fetching tax categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      .insert({
        id: `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        taxRate: taxRate,
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(taxCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating tax category:', error);
    return NextResponse.json(
      { error: 'Failed to create tax category' },
      { status: 500 }
    );
  }
}
