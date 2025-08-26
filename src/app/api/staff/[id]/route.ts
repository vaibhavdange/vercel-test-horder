import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { logger } from "@/lib/logging/logger";
import { UpdateStaffData } from "@/types/staff";

// GET /api/staff/[id] - Get specific staff member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestId = `staff-get-${Date.now()}`;
  
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    logger.info('Staff member retrieved successfully', {
      requestId,
      staffId: staff.id,
      employeeId: staff.employeeId
    });

    return NextResponse.json(staff);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to retrieve staff member', {
      requestId,
      staffId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    return NextResponse.json(
      { error: 'Failed to retrieve staff member' },
      { status: 500 }
    );
  }
}

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestId = `staff-update-${Date.now()}`;
  
  try {
    const body: UpdateStaffData = await request.json();
    
    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id: params.id }
    });

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check if employee ID is being changed and if it already exists
    if (body.employeeId && body.employeeId !== existingStaff.employeeId) {
      const duplicateEmployeeId = await prisma.staff.findUnique({
        where: { employeeId: body.employeeId }
      });

      if (duplicateEmployeeId) {
        return NextResponse.json(
          { error: 'Employee ID already exists' },
          { status: 409 }
        );
      }
    }

    // Update staff and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user if user fields are provided
      if (body.fullName || body.email || body.phone || body.role) {
        await tx.user.update({
          where: { id: existingStaff.userId },
          data: {
            ...(body.fullName && { fullName: body.fullName }),
            ...(body.email && { email: body.email }),
            ...(body.phone && { phone: body.phone }),
            ...(body.role && { role: body.role }),
          }
        });
      }

      // Update staff
      const updatedStaff = await tx.staff.update({
        where: { id: params.id },
        data: {
          ...(body.employeeId && { employeeId: body.employeeId }),
          ...(body.profilePicture && { profilePicture: body.profilePicture }),
          ...(body.dateOfBirth && { dateOfBirth: new Date(body.dateOfBirth) }),
          ...(body.salary !== undefined && { salary: body.salary }),
          ...(body.shiftStart && { shiftStart: body.shiftStart }),
          ...(body.shiftEnd && { shiftEnd: body.shiftEnd }),
          ...(body.address && { address: body.address }),
          ...(body.additionalDetails && { additionalDetails: body.additionalDetails }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              isActive: true,
              lastLogin: true,
              createdAt: true,
              updatedAt: true,
            }
          }
        }
      });

      return updatedStaff;
    });

    logger.info('Staff member updated successfully', {
      requestId,
      staffId: result.id,
      employeeId: result.employeeId
    });

    return NextResponse.json(result);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to update staff member', {
      requestId,
      staffId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestId = `staff-delete-${Date.now()}`;
  
  try {
    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id: params.id }
    });

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Delete staff and user in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete staff (this will cascade to attendance)
      await tx.staff.delete({
        where: { id: params.id }
      });

      // Delete user
      await tx.user.delete({
        where: { id: existingStaff.userId }
      });
    });

    logger.info('Staff member deleted successfully', {
      requestId,
      staffId: params.id,
      employeeId: existingStaff.employeeId
    });

    return NextResponse.json({ message: 'Staff member deleted successfully' });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to delete staff member', {
      requestId,
      staffId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}
