-- Simple Multi-Tenancy Migration
-- This migration adds multi-tenancy support to existing tables only

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

-- Add tenant_id column to existing business tables only
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS tenant_id text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON public.categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant_id ON public.order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tables_tenant_id ON public.tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settings_tenant_id ON public.settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_settings_tenant_id ON public.billing_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_tenant_id ON public.product_variants(tenant_id);
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

-- Create triggers for automatic tenant_id setting
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

CREATE TRIGGER set_tables_tenant_id
  BEFORE INSERT ON public.tables
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_settings_tenant_id
  BEFORE INSERT ON public.settings
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_billing_settings_tenant_id
  BEFORE INSERT ON public.billing_settings
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_product_variants_tenant_id
  BEFORE INSERT ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

-- Enable RLS on tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenants table
CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can update own tenant" ON public.tenants
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own tenant" ON public.tenants
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Create RLS policies for tenant isolation on business tables
CREATE POLICY "Tenant isolation for products" ON public.products
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    tenant_id = (
      SELECT t.id FROM public.tenants t
      WHERE t.owner_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Tenant isolation for categories" ON public.categories
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    tenant_id = (
      SELECT t.id FROM public.tenants t
      WHERE t.owner_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Tenant isolation for orders" ON public.orders
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    tenant_id = (
      SELECT t.id FROM public.tenants t
      WHERE t.owner_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Tenant isolation for order_items" ON public.order_items
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    tenant_id = (
      SELECT t.id FROM public.tenants t
      WHERE t.owner_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Tenant isolation for tables" ON public.tables
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    tenant_id = (
      SELECT t.id FROM public.tenants t
      WHERE t.owner_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Tenant isolation for settings" ON public.settings
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    tenant_id = (
      SELECT t.id FROM public.tenants t
      WHERE t.owner_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Tenant isolation for billing_settings" ON public.billing_settings
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    tenant_id = (
      SELECT t.id FROM public.tenants t
      WHERE t.owner_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Tenant isolation for product_variants" ON public.product_variants
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    tenant_id = (
      SELECT t.id FROM public.tenants t
      WHERE t.owner_id = auth.uid()
      LIMIT 1
    )
  );

-- Add comments
COMMENT ON TABLE public.tenants IS 'Multi-tenant architecture - each tenant represents a restaurant/business';
COMMENT ON COLUMN public.tenants.id IS 'Unique tenant identifier (UUID)';
COMMENT ON COLUMN public.tenants.name IS 'Business/restaurant name';
COMMENT ON COLUMN public.tenants.subdomain IS 'Subdomain for tenant (e.g., mystore.horder.com)';
COMMENT ON COLUMN public.tenants.owner_id IS 'User ID of the tenant owner (UUID)';
COMMENT ON COLUMN public.tenants.settings IS 'JSON settings specific to this tenant';
COMMENT ON COLUMN public.tenants.is_active IS 'Whether the tenant is active';
