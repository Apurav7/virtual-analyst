import axios from 'axios';

/**
 * Google Search Console API Connector
 * Fetches search performance data, keywords, CTR, impressions, and ranking info
 */

export interface SearchMetrics {
  query: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date: string;
  country: string;
  device: string;
}

export interface PageMetrics {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  category?: string;
}

class SearchConsoleConnector {
  private siteUrl: string;
  private accessToken: string;

  constructor(siteUrl: string, accessToken: string) {
    this.siteUrl = siteUrl;
    this.accessToken = accessToken;
  }

  /**
   * Fetch search performance data
   */
  async getSearchPerformance(
    startDate: string,
    endDate: string,
    dimensions: string[] = ['query', 'page']
  ): Promise<SearchMetrics[]> {
    try {
      const response = await axios.post(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
          this.siteUrl
        )}/searchAnalytics/query`,
        {
          startDate,
          endDate,
          dimensions,
          rowLimit: 25000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return this.parseSearchMetrics(response.data);
    } catch (error) {
      console.error('Error fetching Search Console data:', error);
      throw new Error('Failed to fetch Google Search Console metrics');
    }
  }

  /**
   * Get top performing queries
   */
  async getTopQueries(
    startDate: string,
    endDate: string,
    limit: number = 50
  ): Promise<SearchMetrics[]> {
    try {
      const metrics = await this.getSearchPerformance(startDate, endDate, ['query']);
      return metrics.sort((a, b) => b.clicks - a.clicks).slice(0, limit);
    } catch (error) {
      console.error('Error fetching top queries:', error);
      throw new Error('Failed to fetch top queries');
    }
  }

  /**
   * Get page-level search metrics
   */
  async getPageMetrics(
    startDate: string,
    endDate: string
  ): Promise<PageMetrics[]> {
    try {
      const response = await axios.post(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
          this.siteUrl
        )}/searchAnalytics/query`,
        {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 25000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return this.parsePageMetrics(response.data);
    } catch (error) {
      console.error('Error fetching page metrics:', error);
      throw new Error('Failed to fetch page metrics');
    }
  }

  /**
   * Get keywords by position ranges (top 10, 11-20, 21-50, etc.)
   */
  async getKeywordsByPosition(
    startDate: string,
    endDate: string
  ): Promise<Record<string, SearchMetrics[]>> {
    try {
      const metrics = await this.getSearchPerformance(startDate, endDate);

      return {
        top10: metrics.filter((m) => m.position <= 10),
        top20: metrics.filter((m) => m.position <= 20 && m.position > 10),
        top50: metrics.filter((m) => m.position <= 50 && m.position > 20),
        below50: metrics.filter((m) => m.position > 50),
      };
    } catch (error) {
      console.error('Error getting keywords by position:', error);
      throw new Error('Failed to fetch keywords by position');
    }
  }

  /**
   * Get search performance by device
   */
  async getPerformanceByDevice(
    startDate: string,
    endDate: string
  ): Promise<Record<string, any>> {
    try {
      const response = await axios.post(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
          this.siteUrl
        )}/searchAnalytics/query`,
        {
          startDate,
          endDate,
          dimensions: ['device'],
          rowLimit: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return this.parseDeviceMetrics(response.data);
    } catch (error) {
      console.error('Error fetching device metrics:', error);
      throw new Error('Failed to fetch device metrics');
    }
  }

  /**
   * Parse search metrics response
   */
  private parseSearchMetrics(data: any): SearchMetrics[] {
    const metrics: SearchMetrics[] = [];

    if (!data.rows) return metrics;

    data.rows.forEach((row: any) => {
      metrics.push({
        query: row.keys?.[0] || '',
        page: row.keys?.[1] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr ? parseFloat((row.ctr * 100).toFixed(2)) : 0,
        position: row.position ? parseFloat(row.position.toFixed(2)) : 0,
        date: new Date().toISOString().split('T')[0],
        country: 'US',
        device: row.device || 'all',
      });
    });

    return metrics;
  }

  /**
   * Parse page metrics
   */
  private parsePageMetrics(data: any): PageMetrics[] {
    const metrics: PageMetrics[] = [];

    if (!data.rows) return metrics;

    data.rows.forEach((row: any) => {
      metrics.push({
        page: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr ? parseFloat((row.ctr * 100).toFixed(2)) : 0,
        avgPosition: row.position ? parseFloat(row.position.toFixed(2)) : 0,
      });
    });

    return metrics;
  }

  /**
   * Parse device metrics
   */
  private parseDeviceMetrics(data: any): Record<string, any> {
    const result: Record<string, any> = {};

    if (!data.rows) return result;

    data.rows.forEach((row: any) => {
      const device = row.keys?.[0] || 'unknown';
      result[device] = {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr ? parseFloat((row.ctr * 100).toFixed(2)) : 0,
        position: row.position ? parseFloat(row.position.toFixed(2)) : 0,
      };
    });

    return result;
  }
}

export default SearchConsoleConnector;
