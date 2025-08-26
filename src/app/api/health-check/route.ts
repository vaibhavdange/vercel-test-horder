import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE,
      nodeEnv: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL,
    };

    // Test Prisma connection
    let prismaStatus = 'not tested';
    let prismaError = null;
    
    try {
      const { prisma } = await import('@/lib/database/prisma');
      // Just test if we can create the client, don't actually query
      prismaStatus = 'client created successfully';
    } catch (error) {
      prismaStatus = 'failed to create client';
      prismaError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      prisma: {
        status: prismaStatus,
        error: prismaError
      },
      message: 'API is running successfully'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
