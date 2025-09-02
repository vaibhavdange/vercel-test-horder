import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";

// GET /api/products/[id]/variants - Get variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const variants = await supabaseDb.getProductVariants(params.id);
    return NextResponse.json(variants);
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return NextResponse.json(
      { error: "Failed to fetch product variants" },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/variants - Create a new variant for a product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, price } = body;

    if (!name || typeof price !== 'number') {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const variant = await supabaseDb.createProductVariant(params.id, {
      name: String(name).trim(),
      price: Number(price),
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error("Error creating product variant:", error);
    return NextResponse.json(
      { error: "Failed to create product variant" },
      { status: 500 }
    );
  }
}


