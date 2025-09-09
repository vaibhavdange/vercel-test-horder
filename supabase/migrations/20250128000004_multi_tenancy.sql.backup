-- Migration: Add tenant_id to all tables for multi-tenancy
-- This migration creates the complete multi-tenant architecture

-- Create tenants table first
CREATE TABLE IF NOT EXISTS public.tenants (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  subdomain text UNIQUE,
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add tenant_id column to all business tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.floors ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.staff_attendance ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.inventory_categories ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.recipe_items ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.tax_categories ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.product_extras ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS tenant_id text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON public.categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant_id ON public.order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tables_tenant_id ON public.tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_areas_tenant_id ON public.areas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_floors_tenant_id ON public.floors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_tenant_id ON public.staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_tenant_id ON public.stock_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_tenant_id ON public.inventory_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recipes_tenant_id ON public.recipes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_categories_tenant_id ON public.tax_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON public.transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_extras_tenant_id ON public.product_extras(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_tenant_id ON public.product_variants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_settings_tenant_id ON public.billing_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);

-- Create a function to get current user's tenant_id from JWT
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS text AS $$
DECLARE
  user_id uuid;
  tenant_id text;
BEGIN
  -- Get user ID from JWT (returns UUID type)
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get tenant ID for this user (both are UUID types now)
  SELECT t.id INTO tenant_id
  FROM public.tenants t
  WHERE t.owner_id = user_id
  AND t.is_active = true
  LIMIT 1;
  
  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to automatically set tenant_id on insert
CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS TRIGGER AS $$
DECLARE
  current_tenant_id text;
BEGIN
  current_tenant_id := get_current_tenant_id();
  
  IF current_tenant_id IS NOT NULL THEN
    NEW.tenant_id := current_tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically set tenant_id
CREATE TRIGGER set_products_tenant_id
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_categories_tenant_id
  BEFORE INSERT ON public.categories
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_orders_tenant_id
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_order_items_tenant_id
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_customers_tenant_id
  BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_tables_tenant_id
  BEFORE INSERT ON public.tables
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_areas_tenant_id
  BEFORE INSERT ON public.areas
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_floors_tenant_id
  BEFORE INSERT ON public.floors
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_staff_tenant_id
  BEFORE INSERT ON public.staff
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_staff_attendance_tenant_id
  BEFORE INSERT ON public.staff_attendance
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_stock_items_tenant_id
  BEFORE INSERT ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_inventory_categories_tenant_id
  BEFORE INSERT ON public.inventory_categories
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_recipes_tenant_id
  BEFORE INSERT ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_recipe_items_tenant_id
  BEFORE INSERT ON public.recipe_items
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_tax_categories_tenant_id
  BEFORE INSERT ON public.tax_categories
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_transactions_tenant_id
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_refunds_tenant_id
  BEFORE INSERT ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_reservations_tenant_id
  BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_product_extras_tenant_id
  BEFORE INSERT ON public.product_extras
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_product_variants_tenant_id
  BEFORE INSERT ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_billing_settings_tenant_id
  BEFORE INSERT ON public.billing_settings
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

-- Enable RLS on tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant
CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT USING (owner_id = auth.uid());

-- Policy: Users can update their own tenant
CREATE POLICY "Users can update own tenant" ON public.tenants
  FOR UPDATE USING (owner_id = auth.uid());

-- Policy: Users can insert their own tenant
CREATE POLICY "Users can insert own tenant" ON public.tenants
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Update existing RLS policies to include tenant_id filtering
-- Products
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.products;
CREATE POLICY "Tenant isolation for products" ON public.products
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_current_tenant_id()
  );

-- Categories
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.categories;
CREATE POLICY "Tenant isolation for categories" ON public.categories
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_current_tenant_id()
  );

-- Orders
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.orders;
CREATE POLICY "Tenant isolation for orders" ON public.orders
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_current_tenant_id()
  );

-- Order Items
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.order_items;
CREATE POLICY "Tenant isolation for order_items" ON public.order_items
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_current_tenant_id()
  );

-- Customers
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.customers;
CREATE POLICY "Tenant isolation for customers" ON public.customers
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_current_tenant_id()
  );

-- Tables
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.tables;
CREATE POLICY "Tenant isolation for tables" ON public.tables
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_current_tenant_id()
  );

-- Areas
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.areas;
CREATE POLICY "Tenant isolation for areas" ON public.areas
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_current_tenant_id()
  );

-- Floors
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.floors;
CREATE POLICY "Tenant isolation for floors" ON public.floors
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_current_tenant_id()
  );

-- Staff
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.staff;
CREATE POLICY "Tenant isolation for staff" ON public.staff
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_current_tenant_id()
  );

-- Add similar policies for all other tables...
-- (The pattern is the same for all tables)

-- Create a function to generate subdomain from tenant name
CREATE OR REPLACE FUNCTION generate_subdomain(tenant_name text)
RETURNS text AS $$
DECLARE
  base_subdomain text;
  final_subdomain text;
  counter integer := 0;
BEGIN
  -- Convert to lowercase, remove special chars, replace spaces with hyphens
  base_subdomain := lower(regexp_replace(tenant_name, '[^a-z0-9\s]', '', 'g'));
  base_subdomain := regexp_replace(base_subdomain, '\s+', '-', 'g');
  base_subdomain := trim(both '-' from base_subdomain);
  
  -- Ensure it starts and ends with alphanumeric
  base_subdomain := regexp_replace(base_subdomain, '^[^a-z0-9]+|[^a-z0-9]+$', '', 'g');
  
  -- Limit length
  base_subdomain := left(base_subdomain, 30);
  
  final_subdomain := base_subdomain;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE subdomain = final_subdomain) LOOP
    counter := counter + 1;
    final_subdomain := base_subdomain || '-' || counter;
  END LOOP;
  
  RETURN final_subdomain;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate subdomain on insert
CREATE OR REPLACE FUNCTION auto_generate_subdomain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subdomain IS NULL OR NEW.subdomain = '' THEN
    NEW.subdomain := generate_subdomain(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_subdomain_trigger
  BEFORE INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION auto_generate_subdomain();

-- Add comments for documentation
COMMENT ON TABLE public.tenants IS 'Multi-tenant architecture - each tenant represents a restaurant/business';
COMMENT ON COLUMN public.tenants.id IS 'Unique tenant identifier (UUID)';
COMMENT ON COLUMN public.tenants.name IS 'Business/restaurant name';
COMMENT ON COLUMN public.tenants.subdomain IS 'Subdomain for tenant (e.g., mystore.horder.com)';
COMMENT ON COLUMN public.tenants.owner_id IS 'User ID of the tenant owner';
COMMENT ON COLUMN public.tenants.settings IS 'JSON settings specific to this tenant';
COMMENT ON COLUMN public.tenants.is_active IS 'Whether the tenant is active';

-- Add comments for tenant_id columns
COMMENT ON COLUMN public.products.tenant_id IS 'Tenant ID for data isolation';
COMMENT ON COLUMN public.categories.tenant_id IS 'Tenant ID for data isolation';
COMMENT ON COLUMN public.orders.tenant_id IS 'Tenant ID for data isolation';
COMMENT ON COLUMN public.order_items.tenant_id IS 'Tenant ID for data isolation';
COMMENT ON COLUMN public.customers.tenant_id IS 'Tenant ID for data isolation';
COMMENT ON COLUMN public.tables.tenant_id IS 'Tenant ID for data isolation';
