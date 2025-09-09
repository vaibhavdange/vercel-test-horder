-- Storage Setup Migration
-- This migration creates the storage bucket for product images

-- Create the products bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Note: RLS policies for storage.objects are managed by Supabase
-- We only need to create the bucket, the storage policies are handled automatically
