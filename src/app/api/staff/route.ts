import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { logger } from "@/lib/logging/logger";
import { CreateStaffData } from "@/types/staff";
import bcrypt from "bcryptjs";

// GET /api/staff - Get all staff members
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `staff-${Date.now()}`;
  
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { user: { fullName: { contains: search } } },
        { user: { email: { contains: search } } },
        { employeeId: { contains: search } },
        { user: { username: { contains: search } } },
      ];
    }
    
    if (role) {
      where.user = { ...where.user, role };
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Get staff with user data and attendance
    const staff = await prisma.staff.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.staff.count({ where });

    logger.info('Staff list retrieved successfully', {
      requestId,
      count: staff.length,
      total,
      page,
      limit,
      filters: { search, role, isActive }
    });

    return NextResponse.json({
      staff,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to retrieve staff list', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    return NextResponse.json(
      { error: 'Failed to retrieve staff list' },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create new staff member
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `staff-create-${Date.now()}`;
  
  try {
    const body: CreateStaffData = await request.json();
    
    // Validate required fields
    const requiredFields = ['username', 'password', 'fullName', 'email', 'employeeId', 'role'];
    for (const field of requiredFields) {
      if (!body[field as keyof CreateStaffData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: body.username },
          { email: body.email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Check if employee ID already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { employeeId: body.employeeId }
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(body.password, saltRounds);

    // Create user and staff in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          username: body.username,
          passwordHash,
          fullName: body.fullName,
          email: body.email,
          phone: body.phone,
          role: body.role,
        }
      });

      // Create staff
      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          employeeId: body.employeeId,
          profilePicture: body.profilePicture,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          salary: body.salary,
          shiftStart: body.shiftStart,
          shiftEnd: body.shiftEnd,
          address: body.address,
          additionalDetails: body.additionalDetails,
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

      return staff;
    });

    logger.info('Staff member created successfully', {
      requestId,
      staffId: result.id,
      employeeId: result.employeeId,
      username: result.user.username
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to create staff member', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
