import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";

// PUT /api/products/[id]/variants/[variantId] - Update a variant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const body = await request.json();
    const { name, price, isActive } = body;

    if (!name || typeof price !== 'number') {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const variant = await supabaseDb.updateProductVariant(params.variantId, {
      name: String(name).trim(),
      price: Number(price),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error("Error updating product variant:", error);
    return NextResponse.json(
      { error: "Failed to update product variant" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/variants/[variantId] - Delete a variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    await supabaseDb.deleteProductVariant(params.variantId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product variant:", error);
    return NextResponse.json(
      { error: "Failed to delete product variant" },
      { status: 500 }
    );
  }
}
