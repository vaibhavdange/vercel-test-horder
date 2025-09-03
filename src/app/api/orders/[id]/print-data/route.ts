import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, orderNumber, kotNumber, orderType, tableNumber, customerName, customerPhone,
        subtotal, discountAmount, serviceChargeAmount, serviceChargeRate, taxAmount, totalAmount,
        order_items:order_items (
          id, orderId, productId, productName, quantity, unitPrice, totalPrice, customizationNotes,
          product:products ( isAlcohol )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Failed to fetch order for print:', error);
      return NextResponse.json(
        { error: "Failed to fetch order data" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch order print data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
