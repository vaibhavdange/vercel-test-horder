import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: area, error } = await supabase
      .from('areas')
      .select(`
        *,
        floors (*),
        tables (*)
      `)
      .eq('id', params.id)
      .single();

    if (error || !area) {
      return NextResponse.json(
        { error: 'Area not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(area);
  } catch (error) {
    console.error('Error fetching area:', error);
    return NextResponse.json(
      { error: 'Failed to fetch area' },
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
    const { name, description, floorId } = body;

    const supabase = supabaseDb['client'];
    const { data: area, error } = await supabase
      .from('areas')
      .update({
        name,
        description,
        floorId: floorId,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        floors (*)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(area);
  } catch (error) {
    console.error('Error updating area:', error);
    return NextResponse.json(
      { error: 'Failed to update area' },
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
      .from('areas')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting area:', error);
    return NextResponse.json(
      { error: 'Failed to delete area' },
      { status: 500 }
    );
  }
}


