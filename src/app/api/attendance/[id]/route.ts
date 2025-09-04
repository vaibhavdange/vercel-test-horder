import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: attendance, error } = await supabase
      .from('staff_attendance')
      .select(`
        *,
        staff (
          *,
          users (*)
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Transform the data to match frontend expectations
    const transformedAttendance = {
      ...attendance,
      staff: attendance.staff ? {
        ...attendance.staff,
        user: attendance.staff.users
      } : undefined
    };

    return NextResponse.json(transformedAttendance);
  } catch (error) {
    console.error("Failed to fetch attendance record:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance record" },
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
    console.log("Received attendance update data:", body);
    const { status, checkIn, checkOut, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: attendance, error } = await supabase
      .from('staff_attendance')
      .update({
        status,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        notes: notes || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        staff (
          *,
          users (*)
        )
      `)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Transform the data to match frontend expectations
    const transformedAttendance = {
      ...attendance,
      staff: attendance.staff ? {
        ...attendance.staff,
        user: attendance.staff.users
      } : undefined
    };

    console.log("Updated attendance record:", transformedAttendance);
    return NextResponse.json(transformedAttendance);
  } catch (error) {
    console.error("Failed to update attendance record:", error);
    return NextResponse.json(
      { error: `Failed to update attendance record: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
