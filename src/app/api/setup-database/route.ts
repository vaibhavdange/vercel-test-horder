import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const results = [];

    // Create tables based on the schema
    const tables = [
      {
        name: 'categories',
        sql: `
          CREATE TABLE IF NOT EXISTS public.categories (
            id text NOT NULL,
            name text NOT NULL,
            description text,
            icon text NOT NULL DEFAULT '🍴',
            parentId text,
            createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt timestamp without time zone NOT NULL,
            CONSTRAINT categories_pkey PRIMARY KEY (id),
            CONSTRAINT categories_parentId_fkey FOREIGN KEY (parentId) REFERENCES public.categories(id)
          );
        `
      },
      {
        name: 'products',
        sql: `
          CREATE TABLE IF NOT EXISTS public.products (
            id text NOT NULL,
            barcode text,
            name text NOT NULL,
            description text,
            price double precision NOT NULL,
            cost double precision,
            categoryId text,
            taxCategoryId text,
            stockQuantity integer NOT NULL DEFAULT 0,
            minStockLevel integer NOT NULL DEFAULT 0,
            taxRate double precision NOT NULL DEFAULT 0.0,
            serviceChargeRate double precision NOT NULL DEFAULT 0.0,
            image text,
            thumbnail text,
            isActive boolean NOT NULL DEFAULT true,
            createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt timestamp without time zone NOT NULL,
            CONSTRAINT products_pkey PRIMARY KEY (id),
            CONSTRAINT products_categoryId_fkey FOREIGN KEY (categoryId) REFERENCES public.categories(id)
          );
        `
      },
      {
        name: 'customers',
        sql: `
          CREATE TABLE IF NOT EXISTS public.customers (
            id text NOT NULL,
            name text NOT NULL,
            email text,
            phone text,
            address text,
            loyaltyPoints integer NOT NULL DEFAULT 0,
            totalPurchases double precision NOT NULL DEFAULT 0.0,
            createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt timestamp without time zone NOT NULL,
            CONSTRAINT customers_pkey PRIMARY KEY (id)
          );
        `
      },
      {
        name: 'orders',
        sql: `
          CREATE TABLE IF NOT EXISTS public.orders (
            id text NOT NULL,
            orderNumber text NOT NULL,
            kotNumber integer,
            orderType text NOT NULL DEFAULT 'dine-in',
            tableId text,
            tableNumber text,
            customerId text,
            customerName text,
            customerPhone text,
            status text NOT NULL DEFAULT 'pending',
            subStatus text,
            subtotal double precision NOT NULL,
            taxAmount double precision NOT NULL DEFAULT 0.0,
            serviceChargeAmount double precision NOT NULL DEFAULT 0.0,
            serviceChargeRate double precision NOT NULL DEFAULT 0.0,
            discountAmount double precision NOT NULL DEFAULT 0.0,
            totalAmount double precision NOT NULL,
            paymentStatus text NOT NULL DEFAULT 'pending',
            paymentMethod text,
            notes text,
            createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
            startedCookingAt timestamp without time zone,
            readyAt timestamp without time zone,
            updatedAt timestamp without time zone NOT NULL,
            CONSTRAINT orders_pkey PRIMARY KEY (id),
            CONSTRAINT orders_customerId_fkey FOREIGN KEY (customerId) REFERENCES public.customers(id)
          );
        `
      },
      {
        name: 'order_items',
        sql: `
          CREATE TABLE IF NOT EXISTS public.order_items (
            id text NOT NULL,
            orderId text NOT NULL,
            productId text NOT NULL,
            productName text NOT NULL,
            quantity integer NOT NULL,
            unitPrice double precision NOT NULL,
            totalPrice double precision NOT NULL,
            customizationNotes text,
            createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt timestamp without time zone NOT NULL,
            CONSTRAINT order_items_pkey PRIMARY KEY (id),
            CONSTRAINT order_items_productId_fkey FOREIGN KEY (productId) REFERENCES public.products(id),
            CONSTRAINT order_items_orderId_fkey FOREIGN KEY (orderId) REFERENCES public.orders(id)
          );
        `
      },
      {
        name: 'settings',
        sql: `
          CREATE TABLE IF NOT EXISTS public.settings (
            id text NOT NULL,
            key text NOT NULL,
            value text NOT NULL,
            description text,
            updatedAt timestamp without time zone NOT NULL,
            CONSTRAINT settings_pkey PRIMARY KEY (id)
          );
        `
      }
    ];

    // Create each table
    for (const table of tables) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
        
        if (error) {
          results.push({
            table: table.name,
            status: 'failed',
            error: error.message
          });
        } else {
          results.push({
            table: table.name,
            status: 'success'
          });
        }
      } catch (e) {
        results.push({
          table: table.name,
          status: 'exception',
          error: e instanceof Error ? e.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      results: results
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
