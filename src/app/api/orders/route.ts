import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";
import { InventoryService } from "@/lib/services/inventory-service";
import { eventBus } from "@/lib/services/event-bus";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const customerId = searchParams.get('customerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const orders = await supabaseDb.getOrders({
      status: status || undefined,
      search: search || undefined,
      customerId: customerId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });

    // Ensure shape is consistent for clients
    const normalized = (orders || []).map((o: any) => ({
      ...o,
      orderItems: Array.isArray(o?.orderItems) ? o.orderItems : (Array.isArray(o?.order_items) ? o.order_items : []),
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderType,
      tableId,
      tableNumber,
      customerId,
      customerName,
      customerPhone,
      status,
      subStatus,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentStatus,
      paymentMethod,
      notes,
      orderItems,
    } = body;

    // Create order with items
    const order = await supabaseDb.createOrder({
      orderType,
      tableId,
      tableNumber,
      customerId,
      customerName,
      customerPhone,
      status: status || 'pending',
      subStatus,
      subtotal,
      taxAmount: taxAmount || 0,
      discountAmount: discountAmount || 0,
      totalAmount,
      paymentStatus: paymentStatus || 'pending',
      paymentMethod,
      notes,
      orderItems: orderItems.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        customizationNotes: item.customizationNotes,
      })),
    });

    // Automatically deduct ingredients from inventory based on recipes
    try {
      const inventoryResult = await InventoryService.deductIngredientsFromOrder(orderItems);
      
      if (!inventoryResult.success) {
        console.warn('Inventory deduction warnings:', inventoryResult.errors);
        // You can choose to fail the order here if inventory is insufficient
        // For now, we'll allow the order but log the warnings
      }
      
      if (inventoryResult.deductedItems.length > 0) {
        console.log('✅ Inventory automatically deducted:', inventoryResult.deductedItems);
      }
    } catch (inventoryError) {
      console.error('Failed to deduct ingredients from inventory:', inventoryError);
      // Continue with order creation even if inventory deduction fails
      // In production, you might want to handle this differently
    }

    // Emit real-time event
    try {
      eventBus.emit("order.created", { id: order.id, status: order.status, order });
    } catch {}

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    return NextResponse.json(
      { 
        error: "Failed to create order",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
