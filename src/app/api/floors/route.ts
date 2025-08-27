import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const supabase = supabaseDb['client'];
    const { data: floors, error } = await supabase
      .from('floors')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json(floors || []);
  } catch (error) {
    console.error('Error fetching floors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch floors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: floor, error } = await supabase
      .from('floors')
      .insert({
        id: `floor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(floor, { status: 201 });
  } catch (error) {
    console.error('Error creating floor:', error);
    return NextResponse.json(
      { error: 'Failed to create floor' },
      { status: 500 }
    );
  }
}
