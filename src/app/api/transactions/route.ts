import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";
import { eventBus } from "@/lib/services/event-bus";

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseDb['client'];
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    let query = supabase
      .from('transactions')
      .select(`
        *,
        orders (*)
      `)
      .order('createdAt', { ascending: false });

    if (orderId) {
      query = query.eq('orderId', orderId);
    }

    const { data: transactions, error } = await query;

    if (error) throw error;
    return NextResponse.json(transactions || []);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, method, status, reference, customerId, cashierId, notes } = body;

    if (!orderId || !amount || !method) {
      return NextResponse.json(
        { error: "Order ID, amount, and method are required" },
        { status: 400 }
      );
    }

    // Generate transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const supabase = supabaseDb['client'];

    // Check for existing transaction (unique index on orderId)
    const { data: existingRows, error: existingErr } = await supabase
      .from('transactions')
      .select('id')
      .eq('orderId', orderId)
      .limit(1);

    if (existingErr) {
      console.warn('Warning: failed to check existing transaction:', existingErr);
    }

    let transaction;
    if (Array.isArray(existingRows) && existingRows.length > 0) {
      // Update existing transaction
      const { data: updated, error: updateErr } = await supabase
        .from('transactions')
        .update({
          totalAmount: parseFloat(amount),
          paymentMethod: method,
          paymentStatus: status || 'completed',
          notes: notes || null,
          updatedAt: new Date().toISOString(),
        })
        .eq('orderId', orderId)
        .select(`
          *,
          orders (*)
        `)
        .single();

      if (updateErr) throw updateErr;
      transaction = updated;
    } else {
      // Create new transaction
      const { data: inserted, error: insertErr } = await supabase
        .from('transactions')
        .insert({
          id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          transactionNumber: transactionNumber,
          orderId: orderId,
          totalAmount: parseFloat(amount),
          taxAmount: 0,
          discountAmount: 0,
          paymentMethod: method,
          paymentStatus: status || 'completed',
          cashierId: cashierId || null,
          customerId: customerId || null,
          transactionDate: new Date().toISOString(),
          items: JSON.stringify([]),
          notes: notes || null,
          updatedAt: new Date().toISOString(),
        })
        .select(`
          *,
          orders (*)
        `)
        .single();

      if (insertErr) throw insertErr;
      transaction = inserted;
    }

    // Update the related order to reflect payment completion
    try {
      await supabase
        .from('orders')
        .update({
          paymentStatus: 'paid',
          paymentMethod: method,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', orderId);

      // Notify listeners (SSE) that an order has been updated
      try {
        eventBus.emit("order.updated", { id: orderId });
      } catch {}
    } catch (e) {
      console.error('Warning: failed to update order payment status after transaction:', e);
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Failed to create transaction:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Include minimal details to help debugging while avoiding sensitive leakage
    return NextResponse.json({ error: "Failed to create transaction", details: message }, { status: 500 });
  }
}
