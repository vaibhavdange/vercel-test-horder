import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const settings = await supabaseDb.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching permissions settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions settings' },
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
    console.error('Error updating permissions settings:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions settings' },
      { status: 500 }
    );
  }
}


