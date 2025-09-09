-- Test script to verify the multi-tenant migration works
-- Run this after applying the migration to check for any issues

-- Test 1: Check if tenants table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 2: Check if the get_current_tenant_id function exists and works
SELECT 
  routine_name, 
  routine_type, 
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'get_current_tenant_id' 
AND routine_schema = 'public';

-- Test 3: Check if triggers exist
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE '%tenant_id%'
ORDER BY trigger_name;

-- Test 4: Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'tenants';

-- Test 5: Check if indexes exist
SELECT 
  indexname, 
  tablename, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'tenants'
ORDER BY indexname;

-- Test 6: Try to create a test tenant (this will fail if not authenticated, but should not give type errors)
-- Uncomment the following lines to test tenant creation (requires authentication)
/*
INSERT INTO public.tenants (
  id, 
  name, 
  subdomain, 
  owner_id, 
  settings
) VALUES (
  'test_tenant_123',
  'Test Restaurant',
  'test-restaurant',
  auth.uid(),
  '{"test": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;
*/

-- Test 7: Check function execution (this will return NULL if not authenticated, but should not error)
SELECT get_current_tenant_id() as current_tenant_id;

-- Test 8: Verify tenant_id columns exist on business tables
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE column_name = 'tenant_id' 
AND table_schema = 'public'
ORDER BY table_name;
