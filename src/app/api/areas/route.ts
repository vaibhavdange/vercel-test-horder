import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const supabase = supabaseDb['client'];
    const { data: areas, error } = await supabase
      .from('areas')
      .select(`
        *,
        floors (*)
      `)
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json(areas || []);
  } catch (error) {
    console.error('Error fetching areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch areas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, floorId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!floorId) {
      return NextResponse.json(
        { error: 'Floor ID is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: area, error } = await supabase
      .from('areas')
      .insert({
        id: `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        floorId: floorId,
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .select(`
        *,
        floors (*)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(area, { status: 201 });
  } catch (error) {
    console.error('Error creating area:', error);
    return NextResponse.json(
      { error: 'Failed to create area' },
      { status: 500 }
    );
  }
}
