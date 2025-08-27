import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const settings = await supabaseDb.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching customer settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await supabaseDb.updateSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating customer settings:', error);
    return NextResponse.json(
      { error: 'Failed to update customer settings' },
      { status: 500 }
    );
  }
}


