import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: staff, error } = await supabase
      .from('staff')
      .select(`
        *,
        users (*)
      `)
      .eq('id', params.id)
      .single();

    if (error || !staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Transform the data to match frontend expectations
    const transformedStaff = {
      ...staff,
      user: staff.users
    };

    return NextResponse.json(transformedStaff);
  } catch (error) {
    console.error("Failed to fetch staff member:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { 
      fullName, 
      email, 
      phone, 
      role, 
      isActive, 
      employeeId, 
      profilePicture, 
      dateOfBirth, 
      salary, 
      shiftStart, 
      shiftEnd, 
      address, 
      additionalDetails 
    } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required" },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    
    // First get the staff record to find the userId
    const { data: existingStaff, error: fetchError } = await supabase
      .from('staff')
      .select('userId')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingStaff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Update the user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({
        fullName,
        email,
        phone,
        role: role || 'cashier',
        isActive: isActive !== false,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', existingStaff.userId)
      .select()
      .single();

    if (userError) throw userError;

    // Update the staff record with all fields
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .update({
        employeeId: employeeId,
        profilePicture: profilePicture,
        dateOfBirth: dateOfBirth,
        salary: salary,
        shiftStart: shiftStart,
        shiftEnd: shiftEnd,
        address: address,
        additionalDetails: additionalDetails,
        isActive: isActive !== false,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (staffError) throw staffError;

    // Return the updated staff with user data
    return NextResponse.json({ ...staff, user });
  } catch (error) {
    console.error("Failed to update staff member:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete staff member:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}
