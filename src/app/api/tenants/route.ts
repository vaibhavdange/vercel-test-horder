import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

interface TenantData {
  firstName: string;
  lastName: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  subdomain: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantData: TenantData = await request.json();

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'businessName', 'businessType', 'businessAddress', 'city', 'state', 'country'];
    for (const field of requiredFields) {
      if (!tenantData[field as keyof TenantData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate tenant ID
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if subdomain is available
    if (tenantData.subdomain) {
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', tenantData.subdomain)
        .single();

      if (existingTenant) {
        // Generate alternative subdomain
        let counter = 1;
        let newSubdomain = `${tenantData.subdomain}-${counter}`;
        
        while (true) {
          const { data: checkTenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('subdomain', newSubdomain)
            .single();
          
          if (!checkTenant) break;
          counter++;
          newSubdomain = `${tenantData.subdomain}-${counter}`;
        }
        
        tenantData.subdomain = newSubdomain;
      }
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name: tenantData.businessName,
        subdomain: tenantData.subdomain,
        owner_id: user.id,
        settings: {
          businessType: tenantData.businessType,
          address: {
            street: tenantData.businessAddress,
            city: tenantData.city,
            state: tenantData.state,
            country: tenantData.country
          },
          contact: {
            phone: tenantData.phone || '',
            email: user.email
          },
          owner: {
            firstName: tenantData.firstName,
            lastName: tenantData.lastName
          }
        },
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Error creating tenant:', tenantError);
      return NextResponse.json(
        { error: 'Failed to create tenant' },
        { status: 500 }
      );
    }

    // Create default settings for the tenant
    const { error: settingsError } = await supabase
      .from('settings')
      .insert({
        id: `settings_${tenantId}`,
        key: 'tenant_settings',
        value: JSON.stringify({
          restaurantName: tenantData.businessName,
          businessType: tenantData.businessType,
          address: tenantData.businessAddress,
          city: tenantData.city,
          state: tenantData.state,
          country: tenantData.country,
          phone: tenantData.phone || '',
          email: user.email,
          ownerName: `${tenantData.firstName} ${tenantData.lastName}`,
          subdomain: tenantData.subdomain
        }),
        description: `Settings for ${tenantData.businessName}`,
        updated_at: new Date().toISOString(),
        tenant_id: tenantId
      });

    if (settingsError) {
      console.error('Error creating tenant settings:', settingsError);
      // Don't fail the request, just log the error
    }

    // Create some default data for the tenant
    await createDefaultTenantData(supabase, tenantId, tenantData);

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        url: tenantData.subdomain ? `https://${tenantData.subdomain}.horder.com` : null
      }
    });

  } catch (error) {
    console.error('Error in tenant creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createDefaultTenantData(supabase: any, tenantId: string, tenantData: TenantData) {
  try {
    // Create default categories
    const defaultCategories = [
      { name: 'Appetizers', description: 'Starters and appetizers', icon: '🥗' },
      { name: 'Main Course', description: 'Main dishes', icon: '🍽️' },
      { name: 'Beverages', description: 'Drinks and beverages', icon: '🥤' },
      { name: 'Desserts', description: 'Sweet treats', icon: '🍰' },
      { name: 'Specials', description: 'Today\'s specials', icon: '⭐' }
    ];

    const categoryInserts = defaultCategories.map(category => ({
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: category.name,
      description: category.description,
      icon: category.icon,
      tenant_id: tenantId,
      updatedAt: new Date().toISOString(),
    }));

    await supabase.from('categories').insert(categoryInserts);

    // Create default tax categories
    const defaultTaxCategories = [
      { name: 'Standard Tax', description: 'Standard tax rate', taxRate: 18.0 },
      { name: 'Zero Tax', description: 'Zero tax rate', taxRate: 0.0 },
      { name: 'Reduced Tax', description: 'Reduced tax rate', taxRate: 5.0 }
    ];

    const taxCategoryInserts = defaultTaxCategories.map(tax => ({
      id: `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: tax.name,
      description: tax.description,
      taxRate: tax.taxRate,
      tenant_id: tenantId,
      updatedAt: new Date().toISOString(),
    }));

    await supabase.from('tax_categories').insert(taxCategoryInserts);

    // Create default inventory categories
    const defaultInventoryCategories = [
      { name: 'Food Items', description: 'Food ingredients and items', icon: '🍎', color: '#3B82F6' },
      { name: 'Beverages', description: 'Beverage ingredients', icon: '🥤', color: '#10B981' },
      { name: 'Cleaning Supplies', description: 'Cleaning and maintenance', icon: '🧽', color: '#F59E0B' },
      { name: 'Office Supplies', description: 'Office and administrative', icon: '📝', color: '#8B5CF6' }
    ];

    const inventoryCategoryInserts = defaultInventoryCategories.map(category => ({
      id: `inv_cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      tenant_id: tenantId,
      updatedAt: new Date().toISOString(),
    }));

    await supabase.from('inventory_categories').insert(inventoryCategoryInserts);

    // Create default floors and areas
    const { data: floor } = await supabase
      .from('floors')
      .insert({
        id: `floor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'Ground Floor',
        description: 'Main dining area',
        tenant_id: tenantId,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (floor) {
      await supabase
        .from('areas')
        .insert({
          id: `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: 'Main Dining',
          description: 'Main dining area',
          floorId: floor.id,
          tenant_id: tenantId,
          updatedAt: new Date().toISOString(),
        });
    }

  } catch (error) {
    console.error('Error creating default tenant data:', error);
    // Don't throw error, just log it
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        settings: tenant.settings,
        url: tenant.subdomain ? `https://${tenant.subdomain}.horder.com` : null
      }
    });

  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
