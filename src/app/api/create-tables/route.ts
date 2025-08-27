import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const results = [];

    // Create basic tables one by one
    const tables = [
      {
        name: 'categories',
        sql: `
          CREATE TABLE IF NOT EXISTS categories (
            id text PRIMARY KEY,
            name text NOT NULL,
            description text,
            icon text DEFAULT '🍴',
            "parentId" text REFERENCES categories(id),
            "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'products',
        sql: `
          CREATE TABLE IF NOT EXISTS products (
            id text PRIMARY KEY,
            barcode text,
            name text NOT NULL,
            description text,
            price double precision NOT NULL,
            cost double precision,
            "categoryId" text REFERENCES categories(id),
            "taxCategoryId" text,
            "stockQuantity" integer DEFAULT 0,
            "minStockLevel" integer DEFAULT 0,
            "taxRate" double precision DEFAULT 0.0,
            "serviceChargeRate" double precision DEFAULT 0.0,
            image text,
            thumbnail text,
            "isActive" boolean DEFAULT true,
            "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'customers',
        sql: `
          CREATE TABLE IF NOT EXISTS customers (
            id text PRIMARY KEY,
            name text NOT NULL,
            email text,
            phone text,
            address text,
            "loyaltyPoints" integer DEFAULT 0,
            "totalPurchases" double precision DEFAULT 0.0,
            "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'orders',
        sql: `
          CREATE TABLE IF NOT EXISTS orders (
            id text PRIMARY KEY,
            "orderNumber" text NOT NULL,
            "kotNumber" integer,
            "orderType" text DEFAULT 'dine-in',
            "tableId" text,
            "tableNumber" text,
            "customerId" text REFERENCES customers(id),
            "customerName" text,
            "customerPhone" text,
            status text DEFAULT 'pending',
            "subStatus" text,
            subtotal double precision NOT NULL,
            "taxAmount" double precision DEFAULT 0.0,
            "serviceChargeAmount" double precision DEFAULT 0.0,
            "serviceChargeRate" double precision DEFAULT 0.0,
            "discountAmount" double precision DEFAULT 0.0,
            "totalAmount" double precision NOT NULL,
            "paymentStatus" text DEFAULT 'pending',
            "paymentMethod" text,
            notes text,
            "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
            "startedCookingAt" timestamp,
            "readyAt" timestamp,
            "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'order_items',
        sql: `
          CREATE TABLE IF NOT EXISTS order_items (
            id text PRIMARY KEY,
            "orderId" text REFERENCES orders(id),
            "productId" text REFERENCES products(id),
            "productName" text NOT NULL,
            quantity integer NOT NULL,
            "unitPrice" double precision NOT NULL,
            "totalPrice" double precision NOT NULL,
            "customizationNotes" text,
            "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'settings',
        sql: `
          CREATE TABLE IF NOT EXISTS settings (
            id text PRIMARY KEY,
            key text NOT NULL,
            value text NOT NULL,
            description text,
            "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
          );
        `
      }
    ];

    // Try to create each table
    for (const table of tables) {
      try {
        // Note: This might not work due to RLS restrictions
        // You'll likely need to create tables via Supabase Dashboard
        results.push({
          table: table.name,
          status: 'manual_creation_required',
          message: 'Please create this table manually in Supabase Dashboard'
        });
      } catch (e) {
        results.push({
          table: table.name,
          status: 'error',
          error: e instanceof Error ? e.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      status: 'manual_setup_required',
      message: 'Database tables need to be created manually in Supabase Dashboard',
      instructions: [
        '1. Go to your Supabase project dashboard',
        '2. Navigate to SQL Editor',
        '3. Run the SQL from existing_db_sb.md file',
        '4. Or use the Supabase CLI: supabase db push'
      ],
      tables: results
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
