import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          icon
        ),
        product_extras (*)
      `)
      .eq('id', params.id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const updates: any = { ...body };
    // Normalize numeric/optional fields
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.cost !== undefined && updates.cost !== '') updates.cost = Number(updates.cost);
    if (updates.cost === '') delete updates.cost;
    if (updates.stockQuantity !== undefined && updates.stockQuantity !== '') updates.stockQuantity = Number(updates.stockQuantity);
    if (updates.stockQuantity === '') delete updates.stockQuantity;
    if (updates.minStockLevel !== undefined && updates.minStockLevel !== '') updates.minStockLevel = Number(updates.minStockLevel);
    if (updates.minStockLevel === '') delete updates.minStockLevel;
    if (updates.taxRate !== undefined && updates.taxRate !== '') updates.taxRate = Number(updates.taxRate);
    if (updates.taxRate === '') delete updates.taxRate;

    if (updates.categoryId === '') delete updates.categoryId;
    if (updates.barcode === '') delete updates.barcode;
    if (updates.image === '') delete updates.image;
    if (updates.thumbnail === '') delete updates.thumbnail;

    const product = await supabaseDb.updateProduct(params.id, updates);
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await supabaseDb.deleteProduct(params.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
