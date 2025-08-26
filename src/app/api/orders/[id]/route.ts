import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { InventoryService } from "@/lib/services/inventory-service";
import { eventBus } from "@/lib/services/event-bus";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, subStatus } = body;

    // Fetch existing order to enable conditional logic (like cancellation restore)
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { orderItems: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Prepare data object with timing information
    const updateData: any = {
      status,
      subStatus,
      updatedAt: new Date(),
    };

    // Record cooking timing based on status changes
    if (status === "in-process") {
      updateData.startedCookingAt = new Date();
    } else if (status === "ready") {
      updateData.readyAt = new Date();
    }

    // When cancelling, restore product stock and ingredient inventory once
    if (status === "cancelled" && existingOrder.status !== "cancelled") {
      try {
        // Restore ingredient inventory
        try {
          const orderItemsForInventory = existingOrder.orderItems.map((item) => ({
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            customizationNotes: item.customizationNotes || undefined,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          }));
          await InventoryService.restoreIngredientsToInventory(orderItemsForInventory as any);
        } catch (err) {
          console.error("Failed to restore ingredient inventory on cancel:", err);
        }

        // Restore finished product stock
        for (const item of existingOrder.orderItems) {
          try {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (product) {
              await prisma.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { increment: item.quantity } },
              });
            }
          } catch (err) {
            console.error(`Failed to restore stock for product ${item.productId}:`, err);
          }
        }
      } catch (restoreError) {
        console.error("Error during cancellation restore:", restoreError);
      }
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    try {
      eventBus.emit("order.status.changed", { id: order.id, status: order.status, subStatus: order.subStatus });
      eventBus.emit("order.updated", { id: order.id });
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== PUT ENDPOINT CALLED ===');
  console.log('PUT request received for order:', params.id);
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { orderItems, subtotal, taxAmount, totalAmount, subStatus, notes } = body;

    // First, get the existing order to restore product stock and ingredients
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { orderItems: true },
    });

    console.log('Existing order found:', existingOrder);

    if (!existingOrder) {
      console.log('Order not found');
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    console.log('Restoring stock for existing items:', existingOrder.orderItems.length);
    
    // Restore ingredient inventory from existing order items
    try {
      // Convert database OrderItem to expected OrderItem type
      const orderItemsForInventory = existingOrder.orderItems.map(item => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        customizationNotes: item.customizationNotes || undefined,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      }));
      
      await InventoryService.restoreIngredientsToInventory(orderItemsForInventory);
      console.log('Successfully restored ingredient inventory');
    } catch (error) {
      console.error('Error restoring ingredient inventory:', error);
      // Continue with stock restoration instead of failing completely
    }

    // Restore product stock from existing order items
    for (const item of existingOrder.orderItems) {
      try {
        // Check if product still exists before updating
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        
        if (product) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        } else {
          console.log(`Product ${item.productId} not found, skipping stock restoration`);
        }
      } catch (error) {
        console.error(`Error restoring stock for product ${item.productId}:`, error);
        // Continue with other products instead of failing completely
      }
    }

    console.log('Deleting existing order items');
    // Delete existing order items
    await prisma.orderItem.deleteMany({
      where: { orderId: params.id },
    });

    console.log('Deducting stock for new items:', orderItems.length);
    
    // Deduct ingredient inventory for new order items
    try {
      const deductionResult = await InventoryService.deductIngredientsFromOrder(orderItems);
      console.log('Ingredient deduction result:', deductionResult);
    } catch (error) {
      console.error('Error deducting ingredient inventory:', error);
      // Continue with product stock deduction instead of failing completely
    }

    // Deduct stock for new order items
    for (const item of orderItems) {
      try {
        // Check if product exists before updating
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        
        if (product) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        } else {
          console.log(`Product ${item.productId} not found, skipping stock deduction`);
        }
      } catch (error) {
        console.error(`Error deducting stock for product ${item.productId}:`, error);
        // Continue with other products instead of failing completely
      }
    }

    console.log('Creating new order items');
    // Create new order items
    try {
      const newOrderItems = await Promise.all(
        orderItems.map((item: any) =>
          prisma.orderItem.create({
            data: {
              orderId: params.id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              customizationNotes: item.customizationNotes,
            },
          })
        )
      );

      console.log('New order items created:', newOrderItems.length);
    } catch (error) {
      console.error('Error creating order items:', error);
      throw new Error(`Failed to create order items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Update the order with new totals and status
    try {
      const updatedOrder = await prisma.order.update({
        where: { id: params.id },
        data: {
          subtotal,
          taxAmount,
          totalAmount,
          subStatus,
          notes,
          updatedAt: new Date(),
        },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      console.log('Order updated successfully:', updatedOrder.id);
      try {
        eventBus.emit("order.updated", { id: updatedOrder.id, order: updatedOrder });
      } catch {}
      return NextResponse.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      throw new Error(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First, get the order items to restore product stock
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { orderItems: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Restore product stock quantities
    for (const item of order.orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
    }

    // Delete the order (this will cascade delete order items)
    await prisma.order.delete({
      where: { id: params.id },
    });

    try {
      eventBus.emit("order.deleted", { id: params.id });
    } catch {}

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Failed to delete order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
