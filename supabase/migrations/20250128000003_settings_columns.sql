-- Migration: Add restaurant-specific columns to settings table
-- This converts the settings table from key-value pairs to column-based structure

-- Add new columns to the settings table (using snake_case to match actual schema)
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS restaurantname text,
ADD COLUMN IF NOT EXISTS restaurantid text,
ADD COLUMN IF NOT EXISTS storeid text,
ADD COLUMN IF NOT EXISTS addresslineone text,
ADD COLUMN IF NOT EXISTS addresslinetwo text,
ADD COLUMN IF NOT EXISTS restaurantcity text,
ADD COLUMN IF NOT EXISTS restaurantpin text,
ADD COLUMN IF NOT EXISTS restaurantphone text,
ADD COLUMN IF NOT EXISTS restaurantemail text,
ADD COLUMN IF NOT EXISTS restaurantwebsite text,
ADD COLUMN IF NOT EXISTS restaurantgstrate double precision DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS restaurantgst text,
ADD COLUMN IF NOT EXISTS restauranttaxid text,
ADD COLUMN IF NOT EXISTS restaurantfssai text,
ADD COLUMN IF NOT EXISTS restaurantpolicy text,
ADD COLUMN IF NOT EXISTS restaurantfooternote text,
ADD COLUMN IF NOT EXISTS restaurantfooternoteextra text;

-- Create a single settings record if none exists
INSERT INTO public.settings (
  id,
  key,
  value,
  description,
  updated_at,
  restaurantname,
  restaurantid,
  storeid,
  addresslineone,
  addresslinetwo,
  restaurantcity,
  restaurantpin,
  restaurantphone,
  restaurantemail,
  restaurantwebsite,
  restaurantgstrate,
  restaurantgst,
  restauranttaxid,
  restaurantfssai,
  restaurantpolicy,
  restaurantfooternote,
  restaurantfooternoteextra
)
SELECT 
  'default_settings',
  'restaurant_config',
  '{}',
  'Default restaurant configuration',
  NOW(),
  'BORDERS RESTO & PUB',
  'REST_001',
  'STORE_001',
  '123, Example Street',
  'Near City Center',
  'Delhi',
  '110001',
  '9012345678',
  'hello@borderspub.com',
  'www.borderspub.in',
  18.0,
  '27ABCDE1234F1Z5',
  'TAX123456789',
  '11223344556677',
  'No refunds after 30 minutes of order completion',
  'Thank you for dining with us!',
  'Visit us again soon!'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE id = 'default_settings');

-- Migrate existing billing_settings data to the new columns
-- This will update the default settings record with any existing billing_settings data
UPDATE public.settings 
SET 
  restaurantname = COALESCE(
    (SELECT value FROM public.billing_settings WHERE key = 'business_details' AND isActive = true),
    restaurantname
  ),
  restaurantphone = COALESCE(
    (SELECT value FROM public.billing_settings WHERE key = 'business_details' AND isActive = true),
    restaurantphone
  ),
  restaurantemail = COALESCE(
    (SELECT value FROM public.billing_settings WHERE key = 'business_details' AND isActive = true),
    restaurantemail
  ),
  restaurantwebsite = COALESCE(
    (SELECT value FROM public.billing_settings WHERE key = 'business_details' AND isActive = true),
    restaurantwebsite
  ),
  restaurantgst = COALESCE(
    (SELECT value FROM public.billing_settings WHERE key = 'business_details' AND isActive = true),
    restaurantgst
  ),
  restaurantfssai = COALESCE(
    (SELECT value FROM public.billing_settings WHERE key = 'business_details' AND isActive = true),
    restaurantfssai
  ),
  restaurantgstrate = COALESCE(
    (SELECT CAST(value AS double precision) FROM public.billing_settings WHERE key = 'default_tax_rate' AND isActive = true),
    restaurantgstrate
  ),
  updated_at = NOW()
WHERE id = 'default_settings';

-- Handle business_details JSON data specifically
DO $$
DECLARE
    business_details_json jsonb;
BEGIN
    -- Get the business_details JSON from billing_settings
    SELECT value::jsonb INTO business_details_json
    FROM public.billing_settings 
    WHERE key = 'business_details' AND isActive = true
    LIMIT 1;
    
    -- Update settings with parsed JSON data if it exists
    IF business_details_json IS NOT NULL THEN
        UPDATE public.settings 
        SET 
            restaurantname = COALESCE(business_details_json->>'restaurantName', restaurantname),
            addresslineone = COALESCE(business_details_json->>'address', addresslineone),
            restaurantphone = COALESCE(business_details_json->>'phone', restaurantphone),
            restaurantemail = COALESCE(business_details_json->>'email', restaurantemail),
            restaurantwebsite = COALESCE(business_details_json->>'website', restaurantwebsite),
            restaurantfssai = COALESCE(business_details_json->>'fssai', restaurantfssai),
            restaurantgst = COALESCE(business_details_json->>'gstin', restaurantgst),
            updated_at = NOW()
        WHERE id = 'default_settings';
    END IF;
END $$;

-- Add constraints and indexes for better performance
CREATE INDEX IF NOT EXISTS idx_settings_restaurant_id ON public.settings(restaurantid);
CREATE INDEX IF NOT EXISTS idx_settings_store_id ON public.settings(storeid);

-- Add comments for documentation
COMMENT ON COLUMN public.settings.restaurantname IS 'Official name of the restaurant';
COMMENT ON COLUMN public.settings.restaurantid IS 'Unique identifier for the restaurant';
COMMENT ON COLUMN public.settings.storeid IS 'Unique identifier for the store/location';
COMMENT ON COLUMN public.settings.addresslineone IS 'Primary address line';
COMMENT ON COLUMN public.settings.addresslinetwo IS 'Secondary address line (landmark, area)';
COMMENT ON COLUMN public.settings.restaurantcity IS 'City where restaurant is located';
COMMENT ON COLUMN public.settings.restaurantpin IS 'PIN/ZIP code';
COMMENT ON COLUMN public.settings.restaurantphone IS 'Primary contact phone number';
COMMENT ON COLUMN public.settings.restaurantemail IS 'Primary contact email';
COMMENT ON COLUMN public.settings.restaurantwebsite IS 'Restaurant website URL';
COMMENT ON COLUMN public.settings.restaurantgstrate IS 'Default GST rate as percentage (e.g., 18.0 for 18%)';
COMMENT ON COLUMN public.settings.restaurantgst IS 'GST registration number';
COMMENT ON COLUMN public.settings.restauranttaxid IS 'Tax identification number';
COMMENT ON COLUMN public.settings.restaurantfssai IS 'FSSAI license number';
COMMENT ON COLUMN public.settings.restaurantpolicy IS 'Restaurant policy text';
COMMENT ON COLUMN public.settings.restaurantfooternote IS 'Footer note for bills/receipts';
COMMENT ON COLUMN public.settings.restaurantfooternoteextra IS 'Additional footer note for bills/receipts';
