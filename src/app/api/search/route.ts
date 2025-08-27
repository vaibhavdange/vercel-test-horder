import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    let results: any = {};

    // Search products
    if (type === 'all' || type === 'products') {
      const { data: products } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            icon
          )
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10);

      results.products = products || [];
    }

    // Search customers
    if (type === 'all' || type === 'customers') {
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10);

      results.customers = customers || [];
    }

    // Search orders
    if (type === 'all' || type === 'orders') {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          customers (*)
        `)
        .or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%`)
        .limit(10);

      results.orders = orders || [];
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
