import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";

export async function GET() {
  try {
    const staff = await supabaseDb.getStaff();
    
    // Return the expected format with staff array and pagination
    return NextResponse.json({
      staff: staff || [],
      pagination: {
        total: staff?.length || 0,
        page: 1,
        limit: 100,
        totalPages: 1
      }
    });
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
    const { fullName, email, phone, role, isActive, username, password, employeeId, profilePicture, dateOfBirth, salary, shiftStart, shiftEnd, address, additionalDetails } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required" },
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
        username: username || email.split('@')[0], // Use provided username or email prefix
        passwordHash: password ? `hashed_${password}` : 'temp_password_hash', // This should be properly hashed in production
        fullName: fullName,
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
        employeeId: employeeId || `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        profilePicture: profilePicture,
        dateOfBirth: dateOfBirth,
        salary: salary,
        shiftStart: shiftStart,
        shiftEnd: shiftEnd,
        address: address,
        additionalDetails: additionalDetails,
        hireDate: new Date().toISOString(),
        isActive: isActive !== false,
        createdAt: new Date().toISOString(),
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
