-- SQL query to fetch recent orders
-- Run with: supabase db query --file supabase-orders-query.sql

SELECT 
  id,
  "orderNumber",
  "orderType",
  "customerName",
  subtotal,
  "discountAmount",
  "serviceChargeAmount", 
  "serviceChargeRate",
  "taxAmount",
  "totalAmount",
  "paymentStatus",
  "createdAt"
FROM orders 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Get orders with discounts/service charges
SELECT 
  id,
  "orderNumber",
  "discountAmount",
  "serviceChargeAmount",
  "serviceChargeRate"
FROM orders 
WHERE "discountAmount" > 0 OR "serviceChargeAmount" > 0
ORDER BY "createdAt" DESC;
