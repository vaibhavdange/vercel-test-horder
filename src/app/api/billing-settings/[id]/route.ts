import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: setting, error } = await supabase
      .from('billing_settings')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !setting) {
      return NextResponse.json(
        { error: 'Billing setting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error fetching billing setting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing setting' },
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
    const { value, description, isActive } = body;

    const supabase = supabaseDb['client'];
    const { data: setting, error } = await supabase
      .from('billing_settings')
      .update({
        value: typeof value === 'string' ? value : JSON.stringify(value ?? ''),
        description: description || null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating billing setting:', error);
    return NextResponse.json(
      { error: 'Failed to update billing setting' },
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
      .from('billing_settings')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting billing setting:', error);
    return NextResponse.json(
      { error: 'Failed to delete billing setting' },
      { status: 500 }
    );
  }
}
