import { NextRequest, NextResponse } from 'next/server';
import DataSyncService from '@/lib/services/data-sync.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/sync/trigger
 * Manually trigger data sync
 */
export async function POST(request: NextRequest) {
  try {
    // In production, verify the request is authenticated
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SYNC_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate required' },
        { status: 400 }
      );
    }

    const service = new DataSyncService(
      process.env.GOOGLE_ACCESS_TOKEN || '',
      process.env.GOOGLE_ACCESS_TOKEN || '',
      process.env.GOOGLE_ACCESS_TOKEN || ''
    );

    await service.syncDataForDateRange(startDate, endDate);

    return NextResponse.json({
      success: true,
      message: 'Data sync completed',
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: 'Failed to sync data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
