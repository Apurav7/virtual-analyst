import { NextRequest, NextResponse } from 'next/server';
import DataSyncService from '@/lib/services/data-sync.service';

/**
 * GET /api/dashboard
 * Fetch dashboard data for a specific date
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const service = new DataSyncService(
      process.env.GOOGLE_CLIENT_ID || '',
      process.env.GOOGLE_CLIENT_ID || '',
      process.env.GOOGLE_CLIENT_ID || ''
    );

    const dashboardData = await service.getDashboardData(date);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
