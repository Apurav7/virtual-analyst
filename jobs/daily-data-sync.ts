/**
 * Daily Data Sync Job
 * Scheduled to run daily at a specified time (configured in .env.local)
 * Fetches data from GA, Ads, and Search Console, processes it, and generates insights
 *
 * Usage:
 * - npm run sync:now (run immediately)
 * - Cron job in production (e.g., Vercel Cron, AWS Lambda scheduled event, etc.)
 */

import DataSyncService from '../lib/services/data-sync.service';
import { initDB } from '../lib/db/client';

async function runDailySync() {
  console.log(`[${new Date().toISOString()}] Starting daily data sync job...`);

  try {
    // Initialize database
    initDB();

    // Calculate date range (last 7 days for comprehensive analysis)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Initialize service with tokens
    const gaToken = process.env.GOOGLE_ACCESS_TOKEN || '';
    const adsToken = process.env.GOOGLE_ACCESS_TOKEN || '';
    const scToken = process.env.GOOGLE_ACCESS_TOKEN || '';

    if (!gaToken) {
      throw new Error('GOOGLE_ACCESS_TOKEN not configured');
    }

    const service = new DataSyncService(gaToken, adsToken, scToken);

    // Run data sync
    await service.syncDataForDateRange(startDate, endDate);

    console.log(`[${new Date().toISOString()}] ✅ Daily sync completed successfully`);

    return {
      success: true,
      message: 'Daily sync completed',
      startDate,
      endDate,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Daily sync failed:`, error);

    // In production, send alert/notification
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service (Sentry, etc.)
      // or email notification
    }

    throw error;
  }
}

// Run the job
runDailySync().catch((error) => {
  console.error('Fatal error in daily sync job:', error);
  process.exit(1);
});
