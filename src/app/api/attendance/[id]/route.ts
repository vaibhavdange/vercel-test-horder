import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { logger } from "@/lib/logging/logger";
import { UpdateAttendanceData } from "@/types/staff";

// GET /api/attendance/[id] - Get specific attendance record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestId = `attendance-get-${Date.now()}`;
  
  try {
    const attendance = await prisma.staffAttendance.findUnique({
      where: { id: params.id },
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

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    logger.info('Attendance record retrieved successfully', {
      requestId,
      attendanceId: attendance.id,
      staffId: attendance.staffId
    });

    return NextResponse.json(attendance);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to retrieve attendance record', {
      requestId,
      attendanceId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    return NextResponse.json(
      { error: 'Failed to retrieve attendance record' },
      { status: 500 }
    );
  }
}

// PUT /api/attendance/[id] - Update attendance record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestId = `attendance-update-${Date.now()}`;
  
  try {
    const body: UpdateAttendanceData = await request.json();
    
    // Check if attendance record exists
    const existingAttendance = await prisma.staffAttendance.findUnique({
      where: { id: params.id }
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    // Update attendance record
    const attendance = await prisma.staffAttendance.update({
      where: { id: params.id },
      data: {
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

    logger.info('Attendance record updated successfully', {
      requestId,
      attendanceId: attendance.id,
      staffId: attendance.staffId,
      status: attendance.status
    });

    return NextResponse.json(attendance);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to update attendance record', {
      requestId,
      attendanceId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    return NextResponse.json(
      { error: 'Failed to update attendance record' },
      { status: 500 }
    );
  }
}

// DELETE /api/attendance/[id] - Delete attendance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestId = `attendance-delete-${Date.now()}`;
  
  try {
    // Check if attendance record exists
    const existingAttendance = await prisma.staffAttendance.findUnique({
      where: { id: params.id }
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    // Delete attendance record
    await prisma.staffAttendance.delete({
      where: { id: params.id }
    });

    logger.info('Attendance record deleted successfully', {
      requestId,
      attendanceId: params.id,
      staffId: existingAttendance.staffId
    });

    return NextResponse.json({ message: 'Attendance record deleted successfully' });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to delete attendance record', {
      requestId,
      attendanceId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    return NextResponse.json(
      { error: 'Failed to delete attendance record' },
      { status: 500 }
    );
  }
}
