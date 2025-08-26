import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { logger } from "@/lib/logging/logger";
import { CreateAttendanceData } from "@/types/staff";

// GET /api/attendance - Get attendance records
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `attendance-${Date.now()}`;
  
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const date = searchParams.get('date');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (staffId) {
      where.staffId = staffId;
    }
    
    if (date) {
      where.date = new Date(date);
    }
    
    if (dateFrom && dateTo) {
      where.date = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      };
    }
    
    if (status) {
      where.status = status;
    }

    // Get attendance records with staff information
    const attendance = await prisma.staffAttendance.findMany({
      where,
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.staffAttendance.count({ where });

    logger.info('Attendance records retrieved successfully', {
      requestId,
      count: attendance.length,
      total,
      page,
      limit,
      filters: { staffId, date, dateFrom, dateTo, status }
    });

    return NextResponse.json({
      attendance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to retrieve attendance records', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    return NextResponse.json(
      { error: 'Failed to retrieve attendance records' },
      { status: 500 }
    );
  }
}

// POST /api/attendance - Create attendance record
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `attendance-create-${Date.now()}`;
  
  try {
    const body: CreateAttendanceData = await request.json();
    
    // Validate required fields
    if (!body.staffId || !body.date || !body.status) {
      return NextResponse.json(
        { error: 'Staff ID, date, and status are required' },
        { status: 400 }
      );
    }

    // Check if staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: body.staffId }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check if attendance record already exists for this staff and date
    const existingAttendance = await prisma.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId: body.staffId,
          date: new Date(body.date)
        }
      }
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance record already exists for this date' },
        { status: 409 }
      );
    }

    // Create attendance record
    const attendance = await prisma.staffAttendance.create({
      data: {
        staffId: body.staffId,
        date: new Date(body.date),
        status: body.status,
        checkIn: body.checkIn ? new Date(body.checkIn) : null,
        checkOut: body.checkOut ? new Date(body.checkOut) : null,
        notes: body.notes,
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              }
            }
          }
        }
      }
    });

    logger.info('Attendance record created successfully', {
      requestId,
      attendanceId: attendance.id,
      staffId: attendance.staffId,
      date: attendance.date,
      status: attendance.status
    });

    return NextResponse.json(attendance, { status: 201 });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to create attendance record', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    return NextResponse.json(
      { error: 'Failed to create attendance record' },
      { status: 500 }
    );
  }
}
