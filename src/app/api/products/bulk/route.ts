import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productIds, data } = body;

    if (!action || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'Action and productIds array are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    let affectedCount = 0;

    switch (action) {
      case 'delete':
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .in('id', productIds);
        
        if (deleteError) throw deleteError;
        affectedCount = productIds.length;
        break;

      case 'updateStatus':
        const { error: statusError } = await supabase
          .from('products')
          .update({ 
            isActive: data.isActive,
            updatedAt: new Date().toISOString()
          })
          .in('id', productIds);
        
        if (statusError) throw statusError;
        affectedCount = productIds.length;
        break;

      case 'updateCategory':
        const { error: categoryError } = await supabase
          .from('products')
          .update({ 
            categoryId: data.categoryId,
            updatedAt: new Date().toISOString()
          })
          .in('id', productIds);
        
        if (categoryError) throw categoryError;
        affectedCount = productIds.length;
        break;

      case 'updateStock':
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stockQuantity: data.stockQuantity,
            updatedAt: new Date().toISOString()
          })
          .in('id', productIds);
        
        if (stockError) throw stockError;
        affectedCount = productIds.length;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Bulk ${action} completed successfully`,
      affectedCount 
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
