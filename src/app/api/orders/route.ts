import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { generateNextKOTNumber } from "@/lib/database/kot-numbering";
import { formatKOTNumber } from "@/lib/utils";
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

    const where: any = {};

    if (status && status !== 'All') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        table: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
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

    // Generate unique order number and KOT number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const kotNumber = await generateNextKOTNumber();

    let finalCustomerId = customerId;
    let finalCustomerName = customerName;

    // Handle customer creation/update if customerName is provided
    if (customerName && customerName.trim()) {
      if (customerId) {
        // Customer exists, increment their totalPurchases
        try {
          await prisma.customer.update({
            where: { id: customerId },
            data: {
              totalPurchases: {
                increment: 1
              },
              updatedAt: new Date(),
            },
          });
        } catch (error) {
          console.error("Failed to increment customer purchases:", error);
        }
      } else if (customerPhone) {
        // Check if customer exists by phone
        const existingCustomer = await prisma.customer.findUnique({
          where: { phone: customerPhone },
        });

        if (existingCustomer) {
          // Customer exists, use their ID and increment purchases
          finalCustomerId = existingCustomer.id;
          finalCustomerName = existingCustomer.name;
          try {
            await prisma.customer.update({
              where: { id: existingCustomer.id },
              data: {
                totalPurchases: {
                  increment: 1
                },
                updatedAt: new Date(),
              },
            });
          } catch (error) {
            console.error("Failed to increment customer purchases:", error);
          }
        } else {
          // Create new customer
          try {
            const newCustomer = await prisma.customer.create({
              data: {
                name: customerName.trim(),
                phone: customerPhone,
                totalPurchases: 1,
              },
            });
            finalCustomerId = newCustomer.id;
            finalCustomerName = newCustomer.name;
          } catch (error) {
            console.error("Failed to create customer:", error);
            // Continue with order creation even if customer creation fails
          }
        }
      }
    }

    // If dine-in with a tableId, ensure table exists and derive table number
    let resolvedTableId: string | undefined = tableId;
    let resolvedTableNumber: string | undefined = tableNumber;
    if (orderType === 'dine-in' && tableId) {
      const table = await prisma.table.findUnique({ where: { id: tableId } });
      if (!table) {
        return NextResponse.json(
          { error: 'Invalid tableId' },
          { status: 400 }
        );
      }
      resolvedTableNumber = resolvedTableNumber || table.tableNumber;
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        kotNumber,
        orderType,
        tableId: resolvedTableId,
        tableNumber: resolvedTableNumber,
        customerId: finalCustomerId,
        customerName: finalCustomerName || undefined,
        customerPhone: customerPhone || undefined,
        status: status || 'pending',
        subStatus,
        subtotal,
        taxAmount: taxAmount || 0,
        discountAmount: discountAmount || 0,
        totalAmount,
        paymentStatus: paymentStatus || 'pending',
        paymentMethod,
        notes,
        orderItems: {
          create: orderItems.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            customizationNotes: item.customizationNotes,
          })),
        },
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

    // Update product stock quantities (finished product stock)
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    // If dine-in with a tableId, mark the table as occupied
    try {
      if (orderType === 'dine-in' && resolvedTableId) {
        await prisma.table.update({
          where: { id: resolvedTableId },
          data: { status: 'occupied' },
        });
      }
    } catch (tableUpdateError) {
      console.error('Failed to update table status after order creation:', tableUpdateError);
      // Continue; order was created successfully
    }

    // Emit real-time event
    try {
      eventBus.emit("order.created", { id: order.id, status: order.status, order });
    } catch {}

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
