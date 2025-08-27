import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Convert period to date range if not provided
    let startDate = dateFrom;
    let endDate = dateTo;

    if (!startDate || !endDate) {
      const now = new Date();
      const start = new Date();

      switch (period) {
        case 'day':
          start.setHours(0, 0, 0, 0);
          break;
        case 'week':
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          start.setFullYear(now.getFullYear() - 1);
          break;
        default:
          start.setMonth(now.getMonth() - 1);
      }

      startDate = start.toISOString();
      endDate = now.toISOString();
    }

    const analytics = await supabaseDb.getAnalytics(
      startDate,
      endDate,
      period
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
