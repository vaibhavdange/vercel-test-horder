import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentMethod, amount, customerId, partialPayment, discountAmount, discountMode, discountValue, finalTotal } = body;

    // Basic validation
    if (!orderId || !paymentMethod || typeof amount !== 'number') {
      return NextResponse.json(
        { error: "Missing required fields: orderId, paymentMethod, amount" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Ensure order exists
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json(
        { error: "Invalid orderId: order not found" },
        { status: 404 }
      );
    }

    // Update existing transaction if one already exists for this order (orderId is UNIQUE)
    const existing = await prisma.transaction.findUnique({ where: { orderId } });

    let transaction;
    if (existing) {
      transaction = await prisma.transaction.update({
        where: { orderId },
        data: {
          totalAmount: amount,
          taxAmount: 0,
          discountAmount: typeof discountAmount === 'number' ? discountAmount : existing.discountAmount,
          paymentMethod: paymentMethod,
          paymentStatus: partialPayment ? 'pending' : 'completed',
          customerId: customerId ?? existing.customerId ?? order.customerId ?? undefined,
          updatedAt: new Date(),
        },
      });
    } else {
      transaction = await prisma.transaction.create({
        data: {
          transactionNumber: `TXN-${Date.now()}`,
          orderId: orderId,
          totalAmount: amount,
          taxAmount: 0,
          discountAmount: typeof discountAmount === 'number' ? discountAmount : 0,
          paymentMethod: paymentMethod,
          paymentStatus: partialPayment ? 'pending' : 'completed',
          customerId: customerId ?? order.customerId ?? undefined,
          transactionDate: new Date(),
          items: JSON.stringify([]),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Update order payment status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: partialPayment ? 'partial' : 'paid',
        paymentMethod: paymentMethod,
        // Persist discount and final payable if provided
        discountAmount: typeof discountAmount === 'number' ? discountAmount : undefined,
        totalAmount: typeof finalTotal === 'number' ? finalTotal : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(transaction, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("Failed to create transaction:", error);
    const message = (error as any)?.message || "Failed to create transaction";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentMethod = searchParams.get("paymentMethod");
    const paymentStatus = searchParams.get("paymentStatus");
    const orderId = searchParams.get("orderId");

    const where: any = {};

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        customer: true,
        cashier: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
