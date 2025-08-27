import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: floor, error } = await supabase
      .from('floors')
      .select(`
        *,
        areas (*),
        tables (*)
      `)
      .eq('id', params.id)
      .single();

    if (error || !floor) {
      return NextResponse.json(
        { error: 'Floor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(floor);
  } catch (error) {
    console.error('Error fetching floor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch floor' },
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
    const { name, description } = body;

    const supabase = supabaseDb['client'];
    const { data: floor, error } = await supabase
      .from('floors')
      .update({
        name,
        description,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(floor);
  } catch (error) {
    console.error('Error updating floor:', error);
    return NextResponse.json(
      { error: 'Failed to update floor' },
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
      .from('floors')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting floor:', error);
    return NextResponse.json(
      { error: 'Failed to delete floor' },
      { status: 500 }
    );
  }
}


