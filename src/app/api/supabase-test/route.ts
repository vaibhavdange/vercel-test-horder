import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    };

    // Test Supabase connection
    let connectionStatus = 'not tested';
    let connectionError = null;
    let testResults = [];
    
    try {
      const supabase = createServerSupabaseClient();
      
      // Test 1: Basic connection test - try to get database info
      try {
        // Try to access a system table or perform a simple operation
        const { data: systemInfo, error: systemError } = await supabase
          .rpc('version');
        
        if (systemError) {
          testResults.push({
            test: 'database connection',
            status: 'failed',
            error: systemError.message,
            code: systemError.code
          });
        } else {
          testResults.push({
            test: 'database connection',
            status: 'success',
            data: systemInfo
          });
        }
      } catch (e) {
        testResults.push({
          test: 'database connection',
          status: 'exception',
          error: e instanceof Error ? e.message : 'Unknown error'
        });
      }

      // Test 2: Try to list available schemas
      try {
        const { data: schemas, error: schemaError } = await supabase
          .from('information_schema.schemata')
          .select('schema_name')
          .limit(5);
        
        if (schemaError) {
          testResults.push({
            test: 'schema access',
            status: 'failed',
            error: schemaError.message,
            code: schemaError.code
          });
        } else {
          testResults.push({
            test: 'schema access',
            status: 'success',
            schemas: schemas
          });
        }
      } catch (e) {
        testResults.push({
          test: 'schema access',
          status: 'exception',
          error: e instanceof Error ? e.message : 'Unknown error'
        });
      }

      // Test 3: Try to check if our tables exist
      try {
        const { data: tables, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .limit(10);
        
        if (tableError) {
          testResults.push({
            test: 'table listing',
            status: 'failed',
            error: tableError.message,
            code: tableError.code
          });
        } else {
          testResults.push({
            test: 'table listing',
            status: 'success',
            tables: tables?.map(t => t.table_name) || []
          });
        }
      } catch (e) {
        testResults.push({
          test: 'table listing',
          status: 'exception',
          error: e instanceof Error ? e.message : 'Unknown error'
        });
      }

      connectionStatus = 'tests completed';
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
        error: connectionError,
        tests: testResults
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
