import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Products array is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: createdProducts, error } = await supabase
      .from('products')
      .insert(products.map(product => ({
        name: product.name,
        description: product.description,
        price: product.price,
        cost: product.cost,
        stock_quantity: product.stockQuantity || 0,
        min_stock_level: product.minStockLevel || 0,
        category_id: product.categoryId,
        barcode: product.barcode,
        tax_rate: product.taxRate || 0.0,
        image: product.image,
        thumbnail: product.thumbnail,
        is_active: true,
      })))
      .select(`
        *,
        categories (
          id,
          name,
          icon
        )
      `);

    if (error) throw error;
    return NextResponse.json(createdProducts, { status: 201 });
  } catch (error) {
    console.error('Error creating bulk products:', error);
    return NextResponse.json(
      { error: 'Failed to create bulk products' },
      { status: 500 }
    );
  }
}
