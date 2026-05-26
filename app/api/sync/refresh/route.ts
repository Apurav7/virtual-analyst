import { NextRequest, NextResponse } from 'next/server';
import { DataSyncService } from '@/lib/services/data-sync.service';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/sync/refresh
 * On-demand data refresh from Google APIs
 * Fetches data for the last 30 days
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization header for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SYNC_SECRET_KEY || 'dev-key'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);

    console.log(`Starting manual data refresh for ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

    // Initialize data sync service with API keys
    const gaToken = process.env.GOOGLE_ACCESS_TOKEN || '';
    const adsToken = process.env.GOOGLE_ADS_ACCESS_TOKEN || '';
    const scToken = process.env.GOOGLE_SC_ACCESS_TOKEN || '';

    const dataSyncService = new DataSyncService(gaToken, adsToken, scToken);

    // Perform sync
    await dataSyncService.syncDataForDateRange(
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    );

    return NextResponse.json({
      success: true,
      message: 'Data refresh completed successfully',
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Refresh API error:', error);
    return NextResponse.json(
      {
        error: 'Data refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
