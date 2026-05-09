import { NextRequest, NextResponse } from 'next/server';
import { DataSyncService } from '@/lib/services/data-sync.service';
import { format } from 'date-fns';

/**
 * GET /api/cron/daily-sync
 * Scheduled daily data sync (called by Vercel cron)
 * Syncs data for the past 7 days
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'cron-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7); // Sync last 7 days

    console.log(`Starting scheduled daily sync for ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

    // Initialize data sync service
    const gaToken = process.env.GOOGLE_ACCESS_TOKEN || '';
    const adsToken = process.env.GOOGLE_ADS_ACCESS_TOKEN || '';
    const scToken = process.env.GOOGLE_SC_ACCESS_TOKEN || '';

    const dataSyncService = new DataSyncService(gaToken, adsToken, scToken);

    // Perform sync
    await dataSyncService.syncDataForDateRange(
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    );

    // Log sync completion
    await new Promise((resolve) => {
      // Log to data_sync_logs table if desired
      console.log('Daily sync completed successfully');
      resolve(null);
    });

    return NextResponse.json({
      success: true,
      message: 'Daily data sync completed',
      syncedDays: 7,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Daily sync cron error:', error);
    return NextResponse.json(
      {
        error: 'Daily sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
