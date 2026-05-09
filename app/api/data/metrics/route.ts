import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/data/metrics
 * Fetch aggregated metrics for a date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'traffic_source'; // traffic_source, category, device

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate query parameters required' },
        { status: 400 }
      );
    }

    // Query database for metrics
    const { queryAll } = await import('@/lib/db/client');
    const metrics = await queryAll(
      `SELECT * FROM daily_metrics WHERE date BETWEEN $1 AND $2 ORDER BY date DESC, traffic_source`,
      [startDate, endDate]
    );

    // Group by specified dimension
    const grouped: Record<string, any> = {};
    metrics.forEach((m: any) => {
      const key = m[groupBy] || 'unknown';
      if (!grouped[key]) {
        grouped[key] = {
          totalUsers: 0,
          totalSessions: 0,
          totalTransactions: 0,
          totalRevenue: 0,
          avgConversionRate: 0,
          records: [],
        };
      }
      grouped[key].totalUsers += m.users || 0;
      grouped[key].totalSessions += m.sessions || 0;
      grouped[key].totalTransactions += m.transactions || 0;
      grouped[key].totalRevenue += m.revenue || 0;
      grouped[key].records.push(m);
    });

    return NextResponse.json({
      startDate,
      endDate,
      groupBy,
      data: grouped,
    });
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
