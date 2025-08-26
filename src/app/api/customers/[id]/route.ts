import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, phone, address } = body;

    // Check if customer with same phone already exists (excluding current customer)
    if (phone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          phone,
          id: { not: params.id },
        },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: "Customer with this phone number already exists" },
          { status: 400 }
        );
      }
    }

    // Check if customer with same email already exists (excluding current customer)
    if (email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email,
          id: { not: params.id },
        },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        );
      }
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name,
        email,
        phone,
        address,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Failed to update customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}
