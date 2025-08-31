import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const phone = searchParams.get('phone');

    let customers = await supabaseDb.getCustomers() || [];

    // Handle phone search (exact match for existing customer lookup)
    if (phone) {
      customers = customers.filter(customer => 
        customer.phone === phone
      );
      return NextResponse.json(customers);
    }

    // Apply search filter if provided (for name/partial phone search)
    if (search) {
      customers = customers.filter(customer => 
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone?.includes(search) ||
        customer.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

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
    const { name, phone, email } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const customer = await supabaseDb.createCustomer({ name, phone, email });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Failed to create customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
