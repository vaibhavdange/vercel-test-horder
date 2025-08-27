import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Try to access a simple table
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    return NextResponse.json({
      status: 'success',
      data: data,
      count: data?.length || 0
    });
  } catch (error) {
    return NextResponse.json({
      status: 'exception',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
