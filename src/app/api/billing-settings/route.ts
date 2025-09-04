import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

// GET /api/billing-settings?key=...&activeOnly=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true' || undefined;
    
    // For backward compatibility, check if we should use column-based settings
    if (key === 'business_details' || key === 'default_tax_rate' || key === 'default_service_charge_rate') {
      const restaurantSettings = await supabaseDb.getRestaurantSettings();
      
      // Transform column-based data to match the old key-value format
      const transformedSettings = [];
      
      if (key === 'business_details') {
        transformedSettings.push({
          id: 'business_details_column',
          key: 'business_details',
          value: JSON.stringify({
            restaurantName: restaurantSettings.restaurantname,
            address: restaurantSettings.addresslineone,
            phone: restaurantSettings.restaurantphone,
            email: restaurantSettings.restaurantemail,
            website: restaurantSettings.restaurantwebsite,
            fssai: restaurantSettings.restaurantfssai,
            gstin: restaurantSettings.restaurantgst,
          }),
          description: 'Business details for bills and receipts',
          isActive: true,
          createdAt: restaurantSettings.updated_at,
          updatedAt: restaurantSettings.updated_at,
        });
      } else if (key === 'default_tax_rate') {
        transformedSettings.push({
          id: 'default_tax_rate_column',
          key: 'default_tax_rate',
          value: restaurantSettings.restaurantgstrate?.toString() || '18',
          description: 'Default tax rate',
          isActive: true,
          createdAt: restaurantSettings.updated_at,
          updatedAt: restaurantSettings.updated_at,
        });
      }
      
      return NextResponse.json(transformedSettings);
    }
    
    // Fall back to old billing_settings table for other keys
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
// Upsert by unique key - now supports column-based updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, description, isActive } = body || {};
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Handle column-based settings updates
    if (key === 'business_details') {
      const businessDetails = typeof value === 'string' ? JSON.parse(value) : value;
      const updates = {
        restaurantName: businessDetails.restaurantName,
        addressLineOne: businessDetails.address,
        restaurantPhone: businessDetails.phone,
        restaurantEmail: businessDetails.email,
        restaurantWebsite: businessDetails.website,
        restaurantFssai: businessDetails.fssai,
        restaurantGst: businessDetails.gstin,
      };
      
      const updatedSettings = await supabaseDb.updateRestaurantSettings(updates);
      
      // Return in the old format for backward compatibility
      return NextResponse.json({
        id: 'business_details_column',
        key: 'business_details',
        value: JSON.stringify(businessDetails),
        description: description || 'Business details for bills and receipts',
        isActive: true,
        createdAt: updatedSettings.updated_at,
        updatedAt: updatedSettings.updated_at,
      });
    } else if (key === 'default_tax_rate') {
      const taxRate = parseFloat(value);
      const updates = { restaurantGstRate: taxRate };
      
      const updatedSettings = await supabaseDb.updateRestaurantSettings(updates);
      
      // Return in the old format for backward compatibility
      return NextResponse.json({
        id: 'default_tax_rate_column',
        key: 'default_tax_rate',
        value: taxRate.toString(),
        description: description || 'Default tax rate',
        isActive: true,
        createdAt: updatedSettings.updated_at,
        updatedAt: updatedSettings.updated_at,
      });
    }

    // Fall back to old billing_settings table for other keys
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
