import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";

export async function GET() {
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
      .order('createdAt', { ascending: false });

    if (error) throw error;
    
    // Transform the data to match frontend expectations
    const transformedAttendance = (attendance || []).map((record: any) => ({
      ...record,
      staff: record.staff ? {
        ...record.staff,
        user: record.staff.users
      } : undefined
    }));
    
    return NextResponse.json({
      attendance: transformedAttendance,
      pagination: {
        page: 1,
        limit: 100,
        total: transformedAttendance.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received attendance data:", body);
    const { staffId, status, date, notes } = body;

    if (!staffId || !status) {
      console.log("Missing required fields:", { staffId, status });
      return NextResponse.json(
        { error: "Staff ID and status are required" },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: record, error } = await supabase
      .from('staff_attendance')
      .insert({
        id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        staffId: staffId,
        date: date || new Date().toISOString(),
        status: status,
        notes: notes || null,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    console.log("Created attendance record:", record);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Failed to create attendance record:", error);
    return NextResponse.json(
      { error: `Failed to create attendance record: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
