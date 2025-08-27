import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Test basic connection
    const connectionTest = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      serviceRole: process.env.SUPABASE_SERVICE_ROLE ? 'Set' : 'Not set',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
    };

    // Test if tables exist
    const tablesToCheck = ['floors', 'areas', 'tables', 'orders', 'customers', 'products'];
    const tableStatus = {};

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error) {
          tableStatus[tableName] = {
            exists: false,
            error: error.message
          };
        } else {
          tableStatus[tableName] = {
            exists: true,
            count: data?.length || 0
          };
        }
      } catch (e) {
        tableStatus[tableName] = {
          exists: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        };
      }
    }

    // Test specific tables query
    let tablesData = null;
    let tablesError = null;
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .select(`
          *,
          areas (*),
          floors (*)
        `)
        .limit(5);

      if (error) {
        tablesError = error.message;
      } else {
        tablesData = data;
      }
    } catch (e) {
      tablesError = e instanceof Error ? e.message : 'Unknown error';
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      connection: connectionTest,
      tableStatus,
      tablesQuery: {
        data: tablesData,
        error: tablesError
      }
    });
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
