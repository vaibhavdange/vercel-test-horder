import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";
import { eventBus } from "@/lib/services/event-bus";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (*),
        tables (*),
        order_items (
          *,
          products (
            *,
            categories (*)
          )
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Normalize relation key to match frontend expectations
    const normalized = {
      ...order,
      orderItems: Array.isArray((order as any)?.orderItems)
        ? (order as any).orderItems
        : (Array.isArray((order as any)?.order_items) ? (order as any).order_items : []),
    } as any;

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
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
    const order = await supabaseDb.updateOrder(params.id, body);
    try {
      eventBus.emit("order.updated", { order });
    } catch {}
    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, subStatus } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status,
        subStatus: subStatus || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        customers (*),
        tables (*),
        order_items (
          *,
          products (
            *,
            categories (*)
          )
        )
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to update order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
