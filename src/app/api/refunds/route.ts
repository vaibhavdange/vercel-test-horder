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
    const { orderId, transactionId, refundAmount, refundReason, refundMethod, cashierId, customerId, notes, refundedItems } = body;

    if (!orderId || !refundAmount || !refundReason) {
      return NextResponse.json(
        { error: "Order ID, amount, and reason are required" },
        { status: 400 }
      );
    }

    // Generate refund number
    const refundNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const supabase = supabaseDb['client'];
    
    // If refundedItems provided, compute base+tax per item using stored order_items + products
    let computedRefundAmount = Number(refundAmount) || 0;
    try {
      if (Array.isArray(refundedItems) && refundedItems.length > 0) {
        const supa = supabaseDb['client'];
        const ids = refundedItems.map((ri: any) => ri.productId);
        const { data: items } = await supa
          .from('order_items')
          .select(`productId, quantity, unitPrice, taxRate, products ( isAlcohol )`)
          .eq('orderId', orderId)
          .in('productId', ids);
        let sum = 0;
        for (const it of (items || [])) {
          const qty = (refundedItems.find((r: any) => r.productId === it.productId)?.quantity) ?? it.quantity;
          const lineBase = (it.unitPrice || 0) * (qty || 0);
          const isAlcohol = Boolean((it as any)?.products?.isAlcohol);
          const lineTax = isAlcohol ? 0 : lineBase * ((Number(it.taxRate) || 0) / 100);
          sum += lineBase + lineTax;
        }
        if (sum > 0) computedRefundAmount = sum;
      } else if (!computedRefundAmount && orderId) {
        // Full refund fallback: use order totals
        const supa = supabaseDb['client'];
        const { data: ord } = await supa.from('orders').select('subtotal, taxAmount').eq('id', orderId).single();
        if (ord) computedRefundAmount = (ord.subtotal || 0) + (ord.taxAmount || 0);
      }
    } catch (e) {
      console.warn('Refund amount computation failed, using provided amount:', e);
    }

    // Start a transaction by creating the refund first
    const { data: refund, error } = await supabase
      .from('refunds')
      .insert({
        id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        refundNumber: refundNumber,
        orderId: orderId,
        transactionId: transactionId,
        refundAmount: parseFloat(String(computedRefundAmount || 0)),
        refundReason: refundReason,
        refundMethod: refundMethod || 'cash',
        refundStatus: 'completed', // Set to completed immediately
        cashierId: cashierId || null,
        customerId: customerId || null,
        refundDate: new Date().toISOString(),
        refundedItems: JSON.stringify(refundedItems || []),
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
