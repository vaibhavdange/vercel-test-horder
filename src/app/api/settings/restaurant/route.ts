import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const settings = await supabaseDb.getRestaurantSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching restaurant settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await supabaseDb.updateRestaurantSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating restaurant settings:', error);
    return NextResponse.json(
      { error: 'Failed to update restaurant settings' },
      { status: 500 }
    );
  }
}
