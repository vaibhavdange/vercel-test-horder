const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE are set in your .env file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🔧 Setting up BetterAuth with Supabase...');

    // Check if BetterAuth tables exist
    console.log('📋 Checking BetterAuth tables...');
    
    const tables = ['users', 'sessions', 'verification_tokens', 'accounts'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);

        if (error && error.code === '42P01') {
          console.log(`❌ Table '${table}' does not exist`);
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }

    // Check if there are any existing users
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(10);

      if (usersError) {
        console.error('❌ Error checking users:', usersError.message);
      } else if (users && users.length > 0) {
        console.log(`📊 Found ${users.length} existing users:`);
        users.forEach(user => {
          console.log(`   - ${user.email} (${user.name || 'No name'})`);
        });
      } else {
        console.log('📊 No existing users found');
      }
    } catch (err) {
      console.log('❌ Error checking users table:', err.message);
    }

    console.log('\n💡 To set up BetterAuth:');
    console.log('   1. Run the database migrations:');
    console.log('      - Copy the SQL from supabase/migrations/20250128000003_better-auth-schema.sql');
    console.log('      - Run it in your Supabase SQL Editor');
    console.log('');
    console.log('   2. Set up environment variables in .env.local:');
    console.log('      DATABASE_URL=your_supabase_direct_connection_string');
    console.log('      NEXT_PUBLIC_APP_URL=http://localhost:3000');
    console.log('');
    console.log('   3. Start your app: npm run dev');
    console.log('   4. Go to /signup to create your first user');
    console.log('');
    console.log('🔐 BetterAuth will automatically handle:');
    console.log('   - User registration and login');
    console.log('   - Session management');
    console.log('   - Password hashing and verification');
    console.log('   - Email verification (if enabled)');

    console.log('\n🎉 BetterAuth setup guide completed!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupAuth();
