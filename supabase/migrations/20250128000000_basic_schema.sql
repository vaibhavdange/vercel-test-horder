-- Basic Schema Migration
-- This migration creates the basic tables needed for the POS system

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  price double precision NOT NULL DEFAULT 0.0,
  category_id text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id text NOT NULL PRIMARY KEY,
  table_id text,
  customer_name text,
  status text NOT NULL DEFAULT 'pending',
  total_amount double precision NOT NULL DEFAULT 0.0,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id text NOT NULL PRIMARY KEY,
  order_id text NOT NULL,
  product_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price double precision NOT NULL DEFAULT 0.0,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create tables table
CREATE TABLE IF NOT EXISTS public.tables (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'available',
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id text NOT NULL PRIMARY KEY,
  key text NOT NULL,
  value text NOT NULL,
  description text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create billing_settings table
CREATE TABLE IF NOT EXISTS public.billing_settings (
  id text NOT NULL PRIMARY KEY,
  key text NOT NULL,
  value text NOT NULL,
  isActive boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.orders ADD CONSTRAINT orders_table_id_fkey 
  FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE SET NULL;

ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now, will be updated with tenant isolation)
CREATE POLICY "Allow all operations for authenticated users" ON public.products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.order_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.tables
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.billing_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert some sample data
INSERT INTO public.categories (id, name, description) VALUES
  ('cat_001', 'Beverages', 'Hot and cold beverages'),
  ('cat_002', 'Food', 'Main dishes and snacks'),
  ('cat_003', 'Desserts', 'Sweet treats and desserts')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, name, description, price, category_id) VALUES
  ('prod_001', 'Coffee', 'Freshly brewed coffee', 25.0, 'cat_001'),
  ('prod_002', 'Tea', 'Assorted tea varieties', 20.0, 'cat_001'),
  ('prod_003', 'Sandwich', 'Fresh sandwich', 150.0, 'cat_002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tables (id, name, capacity) VALUES
  ('table_001', 'Table 1', 4),
  ('table_002', 'Table 2', 6),
  ('table_003', 'Table 3', 2)
ON CONFLICT (id) DO NOTHING;
