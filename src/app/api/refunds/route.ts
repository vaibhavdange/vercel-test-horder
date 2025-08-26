import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      orderId, 
      transactionId, 
      refundAmount, 
      refundReason, 
      refundMethod, 
      refundedItems, 
      notes 
    } = body;

    // Validate required fields
    if (!orderId || !transactionId || !refundAmount || !refundMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if order exists and is paid
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { transactions: true }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Order is not paid and cannot be refunded" },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Generate unique refund number
    const refundNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        refundNumber,
        orderId,
        transactionId,
        refundAmount,
        refundReason,
        refundMethod,
        refundStatus: 'completed', // Auto-complete for now
        customerId: order.customerId,
        refundDate: new Date(),
        refundedItems: JSON.stringify(refundedItems || []),
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        order: true,
        transaction: true,
        customer: true,
      }
    });

    // Update order payment status to refunded
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'refunded',
        updatedAt: new Date(),
      },
    });

    // Update transaction status to refunded
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentStatus: 'refunded',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(refund);
  } catch (error) {
    console.error("Failed to create refund:", error);
    return NextResponse.json(
      { error: "Failed to create refund" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const refundMethod = searchParams.get("refundMethod");
    const refundStatus = searchParams.get("refundStatus");
    const cashierId = searchParams.get("cashierId");
    const customerId = searchParams.get("customerId");

    const where: any = {};

    if (startDate && endDate) {
      where.refundDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (refundMethod) {
      where.refundMethod = refundMethod;
    }

    if (refundStatus) {
      where.refundStatus = refundStatus;
    }

    if (cashierId) {
      where.cashierId = cashierId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const refunds = await prisma.refund.findMany({
      where,
      include: {
        order: true,
        transaction: true,
        customer: true,
        cashier: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(refunds);
  } catch (error) {
    console.error("Failed to fetch refunds:", error);
    return NextResponse.json(
      { error: "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}
