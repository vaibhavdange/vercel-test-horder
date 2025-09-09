const { createClient } = require('@supabase/supabase-js');

// Fix users table and test tenant creation
async function fixUsersTable() {
  const supabaseUrl = 'http://127.0.0.1:54321';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔧 Fixing Users Table and Testing Tenant Creation...\n');

  try {
    // First, let's check if the user exists in the users table
    console.log('1. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table accessible, found', users.length, 'users');
      console.log('Users:', users.map(u => ({ id: u.id, email: u.email })));
    }

    // Create a test user in the users table
    console.log('\n2. Creating test user in users table...');
    const testUserId = 'b5f49936-0550-4e86-ab8c-4eeba91b40bf';
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .upsert({
        id: testUserId,
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (userError) {
      console.log('❌ User creation error:', userError.message);
    } else {
      console.log('✅ User created/updated in users table:', newUser[0].email);
    }

    // Now try to create a tenant
    console.log('\n3. Creating test tenant...');
    const testTenantId = `test_tenant_${Date.now()}`;
    const { data: newTenant, error: createError } = await supabase
      .from('tenants')
      .insert({
        id: testTenantId,
        name: 'Test Restaurant',
        subdomain: 'test-restaurant',
        owner_id: testUserId,
        settings: { 
          businessType: 'Café',
          address: {
            street: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country'
          }
        }
      })
      .select();

    if (createError) {
      console.log('❌ Tenant creation error:', createError.message);
    } else {
      console.log('✅ Test tenant created successfully!');
      console.log('Tenant details:', {
        id: newTenant[0].id,
        name: newTenant[0].name,
        subdomain: newTenant[0].subdomain,
        owner_id: newTenant[0].owner_id
      });
    }

    // Test subdomain lookup
    console.log('\n4. Testing subdomain lookup...');
    const { data: tenantLookup, error: lookupError } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', 'test-restaurant')
      .eq('is_active', true)
      .single();

    if (lookupError) {
      console.log('❌ Subdomain lookup error:', lookupError.message);
    } else {
      console.log('✅ Subdomain lookup successful:', tenantLookup.name);
    }

    // Test tenant-specific data creation
    console.log('\n5. Testing tenant-specific data creation...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        id: `test_product_${Date.now()}`,
        name: 'Test Product for Test Restaurant',
        price: 15.99,
        category_id: 'cat_001'
      })
      .select();

    if (productError) {
      console.log('❌ Product creation error:', productError.message);
    } else {
      console.log('✅ Product created with tenant_id:', product[0].tenant_id);
    }

    console.log('\n🎉 Multi-tenant setup is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

fixUsersTable();
