import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase client initialization:', {
  url: supabaseUrl,
  key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'undefined'
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Server-side Supabase client (for API routes)
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Use service role key for server-side operations to bypass RLS
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  console.log('Creating Supabase client with URL:', supabaseUrl)
  console.log('Using service role key for server-side operations')

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
