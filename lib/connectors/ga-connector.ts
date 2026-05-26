import fs from 'node:fs';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

/**
 * Google Analytics 4 API Connector
 * Fetches traffic data, user metrics, event data, and user journey information
 */

export interface GATrafficMetrics {
  date: string;
  source: string; // 'organic' | 'google_cpc' | 'direct', etc.
  users: number;
  newUsers: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
  eventCount: number;
}

export interface GAConversionMetrics {
  date: string;
  category: string;
  source: string;
  transactions: number;
  transactionRevenue: number;
  conversionRate: number;
}

export interface GAUserJourney {
  sessionId: string;
  userId: string;
  source: string;
  landingPage: string;
  pageSequence: string[];
  eventSequence: string[];
  sessionDuration: number;
  converted: boolean;
  revenue: number;
}

export interface GAReportDimensionValue {
  name: string;
  value: string;
}

export interface GAReportRow {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
}

export interface GARunReportParams {
  startDate: string;
  endDate: string;
  dimensions?: string[];
  metrics: string[];
  limit?: number;
  orderBys?: any[];
  dimensionFilter?: any;
}

class GAConnector {
  private client: BetaAnalyticsDataClient;
  private propertyId: string;

  constructor(propertyId: string) {
    this.propertyId = propertyId;
    this.client = this.createClient();
  }

  private createClient() {
    const keyReference = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
    const inlineJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON?.trim();
    const options: Record<string, any> = {};

    if (process.env.GOOGLE_PROJECT_ID) {
      options.projectId = process.env.GOOGLE_PROJECT_ID;
    }

    if (inlineJson) {
      const credentials = JSON.parse(inlineJson);
      if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      }
      options.credentials = credentials;
    } else if (keyReference) {
      if (keyReference.startsWith('{')) {
        const credentials = JSON.parse(keyReference);
        if (credentials.private_key) {
          credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }
        options.credentials = credentials;
      } else if (fs.existsSync(keyReference)) {
        options.keyFilename = keyReference;
      }
    }

    return new BetaAnalyticsDataClient(options);
  }

  ensureConfigured() {
    if (!this.propertyId) {
      throw new Error('Missing GOOGLE_ANALYTICS_PROPERTY_ID. Set it in .env.local before using the live GA4 dashboard.');
    }
  }

  async runReport(params: GARunReportParams): Promise<GAReportRow[]> {
    this.ensureConfigured();

    const response = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [
        {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      ],
      dimensions: (params.dimensions || []).map((name) => ({ name })),
      metrics: params.metrics.map((name) => ({ name })),
      limit: params.limit ? String(params.limit) : undefined,
      orderBys: params.orderBys,
      dimensionFilter: params.dimensionFilter,
    });

    const rows = response[0]?.rows || [];

    return rows.map((row: any) => {
      const dimensions = (params.dimensions || []).reduce<Record<string, string>>((acc, name, index) => {
        acc[name] = row.dimensionValues?.[index]?.value || '';
        return acc;
      }, {});

      const metrics = params.metrics.reduce<Record<string, number>>((acc, name, index) => {
        const rawValue = row.metricValues?.[index]?.value;
        acc[name] = rawValue === undefined || rawValue === null || rawValue === '' ? 0 : Number(rawValue);
        return acc;
      }, {});

      return { dimensions, metrics };
    });
  }

  /**
   * Fetch traffic metrics by source for a date range
   */
  async getTrafficBySource(
    startDate: string,
    endDate: string
  ): Promise<GATrafficMetrics[]> {
    try {
      const response = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'eventCount' },
        ],
        dimensions: [
          { name: 'date' },
          { name: 'firstUserSource' },
        ],
      });

      return this.parseTrafficResponse(response);
    } catch (error) {
      console.error('Error fetching GA traffic data:', error);
      throw new Error('Failed to fetch Google Analytics traffic data');
    }
  }

  /**
   * Fetch conversion metrics by product category
   */
  async getConversionsByCategory(
    startDate: string,
    endDate: string
  ): Promise<GAConversionMetrics[]> {
    try {
      const response = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        metrics: [
          { name: 'purchasesTotalQuantity' },
          { name: 'purchasesRevenue' },
          { name: 'eventCount' },
        ],
        dimensions: [
          { name: 'date' },
          { name: 'itemCategory' },
          { name: 'firstUserSource' },
        ],
      });

      return this.parseConversionResponse(response);
    } catch (error) {
      console.error('Error fetching GA conversion data:', error);
      throw new Error('Failed to fetch Google Analytics conversion data');
    }
  }

  /**
   * Fetch engagement metrics (time on page, scroll depth, etc.)
   */
  async getEngagementMetrics(
    startDate: string,
    endDate: string
  ): Promise<Record<string, any>> {
    try {
      const response = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        metrics: [
          { name: 'averageSessionDuration' },
          { name: 'scrolledUsers' },
          { name: 'engagedSessions' },
          { name: 'engagementRate' },
        ],
        dimensions: [
          { name: 'date' },
          { name: 'pagePath' },
        ],
      });

      return this.parseEngagementResponse(response);
    } catch (error) {
      console.error('Error fetching GA engagement data:', error);
      throw new Error('Failed to fetch Google Analytics engagement data');
    }
  }

  /**
   * Parse traffic response from GA API
   */
  private parseTrafficResponse(response: any): GATrafficMetrics[] {
    const metrics: GATrafficMetrics[] = [];

    const rows = response[0]?.rows || response.rows || [];

    if (!rows.length) return metrics;

    rows.forEach((row: any) => {
      metrics.push({
        date: row.dimensionValues[0].value,
        source: row.dimensionValues[1].value,
        users: parseInt(row.metricValues[0].value),
        newUsers: parseInt(row.metricValues[1].value),
        sessions: parseInt(row.metricValues[2].value),
        bounceRate: parseFloat(row.metricValues[3].value) * 100,
        avgSessionDuration: parseFloat(row.metricValues[4].value),
        eventCount: parseInt(row.metricValues[5].value),
      });
    });

    return metrics;
  }

  /**
   * Parse conversion response
   */
  private parseConversionResponse(response: any): GAConversionMetrics[] {
    const metrics: GAConversionMetrics[] = [];

    const rows = response[0]?.rows || response.rows || [];

    if (!rows.length) return metrics;

    rows.forEach((row: any) => {
      const transactions = parseInt(row.metricValues[0].value) || 0;
      const revenue = parseFloat(row.metricValues[1].value) || 0;
      const events = parseInt(row.metricValues[2].value) || 1;

      metrics.push({
        date: row.dimensionValues[0].value,
        category: row.dimensionValues[1].value,
        source: row.dimensionValues[2].value,
        transactions,
        transactionRevenue: revenue,
        conversionRate: transactions > 0 ? (transactions / events) * 100 : 0,
      });
    });

    return metrics;
  }

  /**
   * Parse engagement response
   */
  private parseEngagementResponse(response: any): Record<string, any> {
    return {
      rows: response[0]?.rows || response.rows || [],
      totalUsers: response[0]?.metadata?.currencyCode || response.metadata?.currencyCode,
    };
  }
}

export default GAConnector;
