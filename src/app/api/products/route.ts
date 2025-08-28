import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';
import { eventBus } from '@/lib/services/event-bus';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const products = await supabaseDb.getProducts({
      categoryId: categoryId || undefined,
      search: search || undefined,
      isActive: includeInactive ? undefined : true,
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, cost, stockQuantity, minStockLevel, categoryId, barcode, taxRate, image, thumbnail, extras } = body;

    if (!name || price === undefined || price === null || String(price).trim() === '') {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const parsedPrice = Number(price);
    const parsedCost = cost === undefined || cost === '' ? undefined : Number(cost);
    const parsedStock = stockQuantity === undefined || stockQuantity === '' ? 0 : Number(stockQuantity);
    const parsedMinStock = minStockLevel === undefined || minStockLevel === '' ? 0 : Number(minStockLevel);
    const parsedTaxRate = taxRate === undefined || taxRate === '' ? 0 : Number(taxRate);

    const normalizedCategoryId = categoryId && String(categoryId).trim() !== '' ? categoryId : undefined;
    const normalizedBarcode = barcode && String(barcode).trim() !== '' ? barcode : undefined;
    const normalizedImage = image && String(image).trim() !== '' ? image : undefined;
    const normalizedThumb = thumbnail && String(thumbnail).trim() !== '' ? thumbnail : undefined;

    const product = await supabaseDb.createProduct({
      name: String(name).trim(),
      description: description && String(description).trim() !== '' ? description : undefined,
      price: parsedPrice,
      cost: parsedCost,
      stockQuantity: Number.isFinite(parsedStock) ? parsedStock : 0,
      minStockLevel: Number.isFinite(parsedMinStock) ? parsedMinStock : 0,
      categoryId: normalizedCategoryId,
      barcode: normalizedBarcode,
      taxRate: Number.isFinite(parsedTaxRate) ? parsedTaxRate : 0,
      image: normalizedImage,
      thumbnail: normalizedThumb,
      extras: Array.isArray(extras)
        ? extras.map((e: any) => ({
            name: e?.name,
            price: Number(e?.price ?? 0) || 0,
            stockItemId: e?.stockItemId || undefined,
          }))
        : undefined,
    });

    // Emit real-time event for product creation
    eventBus.emit("product.updated", { id: product.id, product });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
