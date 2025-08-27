import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";

export async function GET() {
  try {
    const supabase = supabaseDb['client'];
    const { data: attendance, error } = await supabase
      .from('staff_attendance')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return NextResponse.json(attendance || []);
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
    const { staffId, status, date, notes } = body;

    if (!staffId || !status) {
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

    if (error) throw error;
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Failed to create attendance record:", error);
    return NextResponse.json(
      { error: "Failed to create attendance record" },
      { status: 500 }
    );
  }
}
