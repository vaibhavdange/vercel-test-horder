import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";

export async function GET() {
  try {
    const supabase = supabaseDb['client'];
    const { data: refunds, error } = await supabase
      .from('refunds')
      .select(`
        *,
        orders (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(refunds || []);
  } catch (error) {
    console.error("Failed to fetch refunds:", error);
    return NextResponse.json(
      { error: "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, transactionId, refundAmount, refundReason, refundMethod, cashierId, customerId, notes } = body;

    if (!orderId || !refundAmount || !refundReason) {
      return NextResponse.json(
        { error: "Order ID, amount, and reason are required" },
        { status: 400 }
      );
    }

    // Generate refund number
    const refundNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const supabase = supabaseDb['client'];
    
    // Start a transaction by creating the refund first
    const { data: refund, error } = await supabase
      .from('refunds')
      .insert({
        id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        refundNumber: refundNumber,
        orderId: orderId,
        transactionId: transactionId,
        refundAmount: parseFloat(refundAmount),
        refundReason: refundReason,
        refundMethod: refundMethod || 'cash',
        refundStatus: 'completed', // Set to completed immediately
        cashierId: cashierId || null,
        customerId: customerId || null,
        refundDate: new Date().toISOString(),
        refundedItems: JSON.stringify([]),
        notes: notes || null,
        updatedAt: new Date().toISOString(),
      })
      .select(`
        *,
        orders (*)
      `)
      .single();

    if (error) throw error;

    // Update the order's payment status to refunded
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        paymentStatus: 'refunded',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error("Failed to update order payment status:", orderUpdateError);
      // Don't fail the refund if order update fails, but log it
    }

    return NextResponse.json(refund, { status: 201 });
  } catch (error) {
    console.error("Failed to create refund:", error);
    return NextResponse.json(
      { error: "Failed to create refund" },
      { status: 500 }
    );
  }
}
