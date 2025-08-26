import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE,
      nodeEnv: process.env.NODE_ENV,
    };

    // Test Supabase connection
    let connectionStatus = 'not tested';
    let connectionError = null;
    
    try {
      const supabase = createServerSupabaseClient();
      
      // Simple test query - just get the count of categories
      const { count, error } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        connectionStatus = 'query failed';
        connectionError = error.message;
      } else {
        connectionStatus = `successful - found ${count} categories`;
      }
    } catch (error) {
      connectionStatus = 'connection failed';
      connectionError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      supabase: {
        status: connectionStatus,
        error: connectionError
      },
      message: 'Supabase test completed'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
