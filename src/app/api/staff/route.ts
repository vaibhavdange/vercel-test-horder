import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";

export async function GET() {
  try {
    const staff = await supabaseDb.getStaff();
    return NextResponse.json(staff);
  } catch (error) {
    console.error("Failed to fetch staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, role, isActive } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    
    // First create a user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        username: email.split('@')[0], // Use email prefix as username
        passwordHash: 'temp_password_hash', // This should be properly hashed in production
        fullName: name,
        email,
        phone,
        role: role || 'cashier',
        isActive: isActive !== false,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) throw userError;

    // Then create a staff record
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert({
        id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        employeeId: `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        isActive: isActive !== false,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (staffError) throw staffError;

    return NextResponse.json({ ...staff, user }, { status: 201 });
  } catch (error) {
    console.error("Failed to create staff:", error);
    return NextResponse.json(
      { error: "Failed to create staff" },
      { status: 500 }
    );
  }
}
