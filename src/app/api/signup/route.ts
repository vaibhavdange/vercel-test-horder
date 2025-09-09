import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

interface SignupData {
  firstName: string;
  lastName: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  email: string;
  password: string;
  subdomain: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const signupData: SignupData = await request.json();

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'businessName', 'businessType', 'businessAddress', 'city', 'state', 'country', 'email', 'password'];
    for (const field of requiredFields) {
      if (!signupData[field as keyof SignupData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create user account using Supabase Auth Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: signupData.email,
      password: signupData.password,
      email_confirm: true, // Auto-confirm for local development
      user_metadata: {
        first_name: signupData.firstName,
        last_name: signupData.lastName,
        business_name: signupData.businessName
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return NextResponse.json(
        { error: `Failed to create user account: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      console.error('No user data returned from auth creation');
      return NextResponse.json(
        { error: 'Failed to create user account: No user data returned' },
        { status: 400 }
      );
    }

    // Create user record in users table
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: authData.user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (userError) {
      console.error('Error creating user record:', userError);
      // Don't fail the request, just log the error
    }

    // Generate tenant ID
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if subdomain is available
    let finalSubdomain = signupData.subdomain;
    if (finalSubdomain) {
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', finalSubdomain)
        .single();

      if (existingTenant) {
        // Generate alternative subdomain
        let counter = 1;
        let newSubdomain = `${finalSubdomain}-${counter}`;
        
        while (true) {
          const { data: checkTenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('subdomain', newSubdomain)
            .single();
          
          if (!checkTenant) break;
          counter++;
          newSubdomain = `${finalSubdomain}-${counter}`;
        }
        
        finalSubdomain = newSubdomain;
      }
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name: signupData.businessName,
        subdomain: finalSubdomain,
        owner_id: authData.user.id,
        settings: {
          businessType: signupData.businessType,
          address: {
            street: signupData.businessAddress,
            city: signupData.city,
            state: signupData.state,
            country: signupData.country
          },
          contact: {
            phone: signupData.phone || '',
            email: authData.user.email
          },
          owner: {
            firstName: signupData.firstName,
            lastName: signupData.lastName
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
        { error: 'Failed to create business profile' },
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
          restaurantName: signupData.businessName,
          businessType: signupData.businessType,
          address: signupData.businessAddress,
          city: signupData.city,
          state: signupData.state,
          country: signupData.country,
          phone: signupData.phone || '',
          email: authData.user.email,
          ownerName: `${signupData.firstName} ${signupData.lastName}`,
          subdomain: finalSubdomain
        }),
        description: `Settings for ${signupData.businessName}`,
        updated_at: new Date().toISOString(),
        tenant_id: tenantId
      });

    if (settingsError) {
      console.error('Error creating tenant settings:', settingsError);
      // Don't fail the request, just log the error
    }

    // Create some default data for the tenant
    await createDefaultTenantData(supabase, tenantId, signupData);

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        url: finalSubdomain ? `http://${finalSubdomain}.localhost:3000` : null
      }
    });

  } catch (error) {
    console.error('Error in signup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createDefaultTenantData(supabase: any, tenantId: string, signupData: SignupData) {
  try {
    console.log('Creating default data for tenant:', tenantId);
    
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

    const { error: categoryError } = await supabase.from('categories').insert(categoryInserts);
    if (categoryError) {
      console.error('Error creating categories:', categoryError);
    } else {
      console.log('Created', categoryInserts.length, 'default categories');
    }

    // Create default tables
    const defaultTables = [
      { name: 'Table 1', capacity: 4 },
      { name: 'Table 2', capacity: 4 },
      { name: 'Table 3', capacity: 6 },
      { name: 'Table 4', capacity: 2 }
    ];

    const tableInserts = defaultTables.map(table => ({
      id: `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: table.name,
      capacity: table.capacity,
      status: 'available',
      tenant_id: tenantId,
      updatedAt: new Date().toISOString(),
    }));

    const { error: tableError } = await supabase.from('tables').insert(tableInserts);
    if (tableError) {
      console.error('Error creating tables:', tableError);
    } else {
      console.log('Created', tableInserts.length, 'default tables');
    }

  } catch (error) {
    console.error('Error creating default tenant data:', error);
    // Don't throw error, just log it
  }
}
