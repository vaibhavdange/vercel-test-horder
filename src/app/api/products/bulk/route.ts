import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productIds, data } = body;

    if (!action || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and product IDs are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'delete':
        // Bulk delete products
        result = await prisma.product.deleteMany({
          where: {
            id: { in: productIds }
          }
        });
        break;

      case 'updateStatus':
        // Bulk update product status
        if (typeof data?.isActive !== 'boolean') {
          return NextResponse.json(
            { error: 'isActive status is required for updateStatus action' },
            { status: 400 }
          );
        }
        result = await prisma.product.updateMany({
          where: {
            id: { in: productIds }
          },
          data: {
            isActive: data.isActive
          }
        });
        break;

      case 'updateCategory':
        // Bulk update product category
        if (!data?.categoryId) {
          return NextResponse.json(
            { error: 'categoryId is required for updateCategory action' },
            { status: 400 }
          );
        }
        result = await prisma.product.updateMany({
          where: {
            id: { in: productIds }
          },
          data: {
            categoryId: data.categoryId
          }
        });
        break;

      case 'updateStock':
        // Bulk update stock quantities
        if (typeof data?.stockQuantity !== 'number' || data.stockQuantity < 0) {
          return NextResponse.json(
            { error: 'Valid stockQuantity is required for updateStock action' },
            { status: 400 }
          );
        }
        result = await prisma.product.updateMany({
          where: {
            id: { in: productIds }
          },
          data: {
            stockQuantity: data.stockQuantity
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: delete, updateStatus, updateCategory, updateStock' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      affectedCount: result.count
    });

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
