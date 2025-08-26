import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};

    if (key) {
      where.key = key;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const billingSettings = await prisma.billingSettings.findMany({
      where,
      orderBy: {
        key: 'asc'
      }
    });

    return NextResponse.json(billingSettings);
  } catch (error) {
    console.error('Error fetching billing settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Check if setting with same key already exists
    const existingSetting = await prisma.billingSettings.findUnique({
      where: { key }
    });

    if (existingSetting) {
      return NextResponse.json(
        { error: 'Billing setting with this key already exists' },
        { status: 409 }
      );
    }

    const billingSetting = await prisma.billingSettings.create({
      data: {
        key: key.trim(),
        value: typeof value === 'string' ? value : JSON.stringify(value),
        description: description?.trim()
      }
    });

    return NextResponse.json(billingSetting, { status: 201 });
  } catch (error) {
    console.error('Error creating billing setting:', error);
    return NextResponse.json(
      { error: 'Failed to create billing setting' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { value, description, isActive } = body;
    
    // Extract ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json(
        { error: 'Setting ID is required' },
        { status: 400 }
      );
    }

    if (value === undefined && description === undefined && isActive === undefined) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }

    // Check if setting exists
    const existingSetting = await prisma.billingSettings.findUnique({
      where: { id }
    });

    if (!existingSetting) {
      return NextResponse.json(
        { error: 'Billing setting not found' },
        { status: 404 }
      );
    }

    // Update the setting
    const updateData: any = {};
    if (value !== undefined) {
      updateData.value = typeof value === 'string' ? value : JSON.stringify(value);
    }
    if (description !== undefined) {
      updateData.description = description?.trim();
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedSetting = await prisma.billingSettings.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedSetting);
  } catch (error) {
    console.error('Error updating billing setting:', error);
    return NextResponse.json(
      { error: 'Failed to update billing setting' },
      { status: 500 }
    );
  }
}
