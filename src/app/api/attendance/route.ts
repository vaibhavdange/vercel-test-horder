import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/database/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const date = searchParams.get('date');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const supabase = supabaseDb['client'];
    let query = supabase
      .from('staff_attendance')
      .select(`
        *,
        staff (
          *,
          users (*)
        )
      `);

    // Apply filters
    if (staffId) {
      query = query.eq('staffId', staffId);
    }
    
    if (date) {
      // Filter by specific date (YYYY-MM-DD format)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('date', startOfDay.toISOString())
        .lte('date', endOfDay.toISOString());
    }
    
    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('date', dateTo);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination and ordering
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query
      .order('date', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to);

    const { data: attendance, error, count } = await query;

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
        page,
        limit,
        total: count || transformedAttendance.length,
        pages: Math.ceil((count || transformedAttendance.length) / limit)
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
    const { staffId, status, date, checkIn, checkOut, notes } = body;

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
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        notes: notes || null,
        updatedAt: new Date().toISOString(),
      })
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
      ...record,
      staff: record.staff ? {
        ...record.staff,
        user: record.staff.users
      } : undefined
    };
    
    console.log("Created attendance record:", transformedAttendance);
    return NextResponse.json(transformedAttendance, { status: 201 });
  } catch (error) {
    console.error("Failed to create attendance record:", error);
    return NextResponse.json(
      { error: `Failed to create attendance record: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
