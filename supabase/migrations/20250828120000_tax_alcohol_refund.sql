-- Tax/Alcohol/Refund migration
-- Adds item-level tax fields and alcohol flag

BEGIN;

-- Products: alcohol flag
ALTER TABLE "public"."products"
ADD COLUMN IF NOT EXISTS "isAlcohol" boolean DEFAULT false NOT NULL;

-- Order items: store tax rate and computed tax amount per line
ALTER TABLE "public"."order_items"
ADD COLUMN IF NOT EXISTS "taxRate" double precision DEFAULT 0.0 NOT NULL;

ALTER TABLE "public"."order_items"
ADD COLUMN IF NOT EXISTS "taxAmount" double precision DEFAULT 0.0 NOT NULL;

COMMIT;


