import { query, queryAll, queryOne } from '../db/client';
import GAConnector from '../connectors/ga-connector';
import GoogleAdsConnector from '../connectors/ads-connector';
import SearchConsoleConnector from '../connectors/search-console-connector';
import InsightsGenerator from '../ai/insights-generator';

/**
 * Data Sync Service
 * Orchestrates fetching data from all sources and aggregating into database
 */

export class DataSyncService {
  private gaConnector: GAConnector;
  private adsConnector: GoogleAdsConnector;
  private scConnector: SearchConsoleConnector;
  private insightsGenerator: InsightsGenerator;

  constructor(gaToken: string, adsToken: string, scToken: string) {
    this.gaConnector = new GAConnector(process.env.GOOGLE_ANALYTICS_PROPERTY_ID || '');
    this.adsConnector = new GoogleAdsConnector(
      process.env.GOOGLE_ADS_CUSTOMER_ID || '',
      adsToken
    );
    this.scConnector = new SearchConsoleConnector(
      process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || '',
      scToken
    );
    this.insightsGenerator = new InsightsGenerator();
  }

  /**
   * Sync all data for a given date range
   */
  async syncDataForDateRange(startDate: string, endDate: string) {
    console.log(`Starting data sync for ${startDate} to ${endDate}`);

    try {
      // Fetch from all sources
      await Promise.all([
        this.syncGAData(startDate, endDate),
        this.syncAdsData(startDate, endDate),
        this.syncSearchConsoleData(startDate, endDate),
      ]);

      // Generate insights
      await this.generateInsightsForDateRange(startDate, endDate);

      console.log('Data sync completed successfully');
    } catch (error) {
      console.error('Error during data sync:', error);
      throw error;
    }
  }

  /**
   * Sync Google Analytics data
   */
  private async syncGAData(startDate: string, endDate: string) {
    try {
      console.log('Syncing Google Analytics data...');

      // Fetch traffic by source
      const trafficData = await this.gaConnector.getTrafficBySource(startDate, endDate);

      // Store traffic data
      for (const metric of trafficData) {
        await query(
          `INSERT INTO daily_metrics (date, traffic_source, users, sessions, bounce_rate, avg_session_duration, event_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (date, traffic_source, category) DO UPDATE SET
             users = EXCLUDED.users,
             sessions = EXCLUDED.sessions,
             bounce_rate = EXCLUDED.bounce_rate,
             avg_session_duration = EXCLUDED.avg_session_duration`,
          [
            metric.date,
            metric.source,
            metric.users,
            metric.sessions,
            metric.bounceRate,
            metric.avgSessionDuration,
            metric.eventCount,
          ]
        );
      }

      // Fetch and store conversion data
      const conversionData = await this.gaConnector.getConversionsByCategory(startDate, endDate);
      for (const metric of conversionData) {
        await query(
          `INSERT INTO daily_metrics (date, traffic_source, category, transactions, revenue, conversion_rate)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (date, traffic_source, category) DO UPDATE SET
             transactions = EXCLUDED.transactions,
             revenue = EXCLUDED.revenue,
             conversion_rate = EXCLUDED.conversion_rate`,
          [
            metric.date,
            metric.source,
            metric.category,
            metric.transactions,
            metric.transactionRevenue,
            metric.conversionRate,
          ]
        );
      }

      console.log(`GA data synced: ${trafficData.length} records`);
    } catch (error) {
      console.error('Error syncing GA data:', error);
      throw error;
    }
  }

  /**
   * Sync Google Ads data
   */
  private async syncAdsData(startDate: string, endDate: string) {
    try {
      console.log('Syncing Google Ads data...');

      const adsMetrics = await this.adsConnector.getDailyMetrics(startDate, endDate);

      for (const metric of adsMetrics) {
        await query(
          `INSERT INTO daily_metrics (date, traffic_source, clicks, impressions, cost, conversions, roas)
           VALUES ($1, 'google_cpc', $2, $3, $4, $5, $6)
           ON CONFLICT (date, traffic_source, category) DO UPDATE SET
             clicks = EXCLUDED.clicks,
             impressions = EXCLUDED.impressions,
             cost = EXCLUDED.cost,
             conversions = EXCLUDED.conversions,
             roas = EXCLUDED.roas`,
          [startDate, metric.clicks, metric.impressions, metric.cost, metric.conversions, metric.roas]
        );
      }

      console.log(`Ads data synced: ${adsMetrics.length} records`);
    } catch (error) {
      console.error('Error syncing Ads data:', error);
      // Don't throw - continue with other sources
    }
  }

  /**
   * Sync Search Console data
   */
  private async syncSearchConsoleData(startDate: string, endDate: string) {
    try {
      console.log('Syncing Search Console data...');

      const searchMetrics = await this.scConnector.getSearchPerformance(startDate, endDate);

      for (const metric of searchMetrics) {
        await query(
          `INSERT INTO search_keywords (date, keyword, impressions, clicks, ctr, avg_position)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (date, keyword) DO UPDATE SET
             impressions = EXCLUDED.impressions,
             clicks = EXCLUDED.clicks,
             ctr = EXCLUDED.ctr,
             avg_position = EXCLUDED.avg_position`,
          [metric.date, metric.query, metric.impressions, metric.clicks, metric.ctr, metric.position]
        );
      }

      console.log(`Search Console data synced: ${searchMetrics.length} records`);
    } catch (error) {
      console.error('Error syncing Search Console data:', error);
      // Don't throw - continue with other sources
    }
  }

  /**
   * Generate AI insights for date range
   */
  private async generateInsightsForDateRange(startDate: string, endDate: string) {
    try {
      console.log('Generating AI insights...');

      // Get aggregated metrics for the date range
      const metrics = await queryAll(
        `SELECT * FROM daily_metrics WHERE date BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const keywords = await queryAll(
        `SELECT * FROM search_keywords WHERE date BETWEEN $1 AND $2 ORDER BY impressions DESC LIMIT 20`,
        [startDate, endDate]
      );

      // Group by category and generate insights
      const categories = [...new Set(metrics.map((m: any) => m.category).filter(Boolean))];

      for (const category of categories) {
        const categoryMetrics = metrics.filter((m: any) => m.category === category);
        const trafficMetrics = {
          organic: categoryMetrics.find((m: any) => m.traffic_source === 'organic') || {},
          paid: categoryMetrics.find((m: any) => m.traffic_source === 'google_cpc') || {},
        };

        const input = {
          date: startDate,
          category,
          trafficMetrics,
          categoryMetrics: categoryMetrics[0] || {},
          topKeywords: keywords.slice(0, 10),
          topPages: [],
          userJourneyData: {
            avgSessionDuration: 0,
            bounceRate: 0,
            conversionRate: 0,
          },
        };

        const insights = await this.insightsGenerator.generateDailyInsights(input);

        // Store insights
        for (const insight of insights) {
          await query(
            `INSERT INTO ai_insights (date, insight_type, category, title, insight_text, recommendation, priority, impact_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              startDate,
              'category_analysis',
              category,
              insight.title,
              insight.insight,
              insight.recommendation,
              insight.priority,
              insight.impact_score,
            ]
          );
        }
      }

      console.log(`Insights generated for ${categories.length} categories`);
    } catch (error) {
      console.error('Error generating insights:', error);
      // Don't throw - insights are optional
    }
  }

  /**
   * Get dashboard data for a specific date
   */
  async getDashboardData(date: string) {
    const dailyMetrics = await queryAll(
      `SELECT * FROM daily_metrics WHERE date = $1 ORDER BY traffic_source`,
      [date]
    );

    const insights = await queryAll(
      `SELECT * FROM ai_insights WHERE date = $1 ORDER BY impact_score DESC LIMIT 10`,
      [date]
    );

    const topKeywords = await queryAll(
      `SELECT * FROM search_keywords WHERE date = $1 ORDER BY impressions DESC LIMIT 20`,
      [date]
    );

    return {
      date,
      metrics: dailyMetrics,
      insights,
      keywords: topKeywords,
    };
  }
}

export default DataSyncService;
