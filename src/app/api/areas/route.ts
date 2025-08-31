import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const areas = await supabaseDb.getAreas();
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

    const area = await supabaseDb.createArea({
      name,
      description,
      floorId
    });

    return NextResponse.json(area, { status: 201 });
  } catch (error) {
    console.error('Error creating area:', error);
    return NextResponse.json(
      { error: 'Failed to create area' },
      { status: 500 }
      );
  }
}
