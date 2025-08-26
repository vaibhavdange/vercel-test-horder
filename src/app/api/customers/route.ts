import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const phone = searchParams.get('phone');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (phone) {
      where.phone = phone;
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      take: phone ? 1 : 50, // Limit results for search, single result for phone lookup
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address } = body;

    // Check if customer with same phone already exists
    if (phone) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { phone },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: "Customer with this phone number already exists" },
          { status: 400 }
        );
      }
    }

    // Check if customer with same email already exists
    if (email) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        );
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Failed to create customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
