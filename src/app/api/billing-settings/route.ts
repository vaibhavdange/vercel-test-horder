import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

// GET /api/billing-settings?key=...&activeOnly=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true' || undefined;
    const settings = await supabaseDb.getBillingSettings({ key, activeOnly });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching billing settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing settings' },
      { status: 500 }
    );
  }
}

// POST /api/billing-settings
// Upsert by unique key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, description, isActive } = body || {};
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const supabase = (supabaseDb as any)['client'];

    // Upsert by unique key
    const { data, error } = await supabase
      .from('billing_settings')
      .upsert({
        id: `bs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value ?? ''),
        description: description || null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        updatedAt: new Date().toISOString(),
      }, { onConflict: 'key' })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating billing setting:', error);
    return NextResponse.json(
      { error: 'Failed to create billing setting' },
      { status: 500 }
    );
  }
}

// PUT /api/billing-settings (kept for backwards compatibility to update generic settings table)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await supabaseDb.updateSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating billing settings:', error);
    return NextResponse.json(
      { error: 'Failed to update billing settings' },
      { status: 500 }
    );
  }
}
