-- Create product_variants table for alcohol sizes and other variants
CREATE TABLE public.product_variants (
  id text NOT NULL,
  productId text NOT NULL,
  name text NOT NULL,
  price double precision NOT NULL DEFAULT 0.0,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_productId_fkey FOREIGN KEY (productId) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_product_variants_product_id ON public.product_variants(productId);
CREATE INDEX idx_product_variants_active ON public.product_variants(isActive);

-- Add RLS policies
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.product_variants
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert some sample variants for testing
INSERT INTO public.product_variants (id, productId, name, price, isActive) VALUES
  ('var_001', 'prod_001', '30ml', 0.0, true),
  ('var_002', 'prod_001', '60ml', 50.0, true),
  ('var_003', 'prod_001', '90ml', 75.0, true);
