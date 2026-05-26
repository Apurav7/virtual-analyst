import { format, subDays } from 'date-fns';
import GAConnector from '../connectors/ga-connector';

type MetricKey =
  | 'users'
  | 'pageViews'
  | 'avgSessionDuration'
  | 'bounceRate'
  | 'purchases'
  | 'purchaseRevenue'
  | 'eventCount';

type DimensionKey = 'city' | 'source' | 'eventName';

interface MetricDefinition {
  key: MetricKey;
  apiName: string;
  label: string;
  aliases: string[];
  format: 'number' | 'percent' | 'duration' | 'currency';
}

interface DimensionDefinition {
  key: DimensionKey;
  apiName: string;
  label: string;
}

export interface GAOverviewResponse {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: Record<MetricKey, number>;
  bySource: Array<Record<string, string | number>>;
  topCities: Array<Record<string, string | number>>;
}

export interface GAQuestionResponse {
  question: string;
  answer: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  interpretation: {
    dimension: string | null;
    metrics: string[];
    filters: Record<string, string>;
    ranking: boolean;
  };
  columns: string[];
  rows: Array<Record<string, string | number>>;
  chart: {
    xKey: string;
    metricKey: string;
    label: string;
  } | null;
}

const METRICS: MetricDefinition[] = [
  {
    key: 'users',
    apiName: 'activeUsers',
    label: 'Users',
    aliases: ['user', 'users', 'visitor', 'visitors', 'traffic'],
    format: 'number',
  },
  {
    key: 'pageViews',
    apiName: 'screenPageViews',
    label: 'Page views',
    aliases: ['page view', 'page views', 'pv', 'pvs', 'views'],
    format: 'number',
  },
  {
    key: 'avgSessionDuration',
    apiName: 'averageSessionDuration',
    label: 'Avg session duration',
    aliases: ['avg session duration', 'average session duration', 'session duration', 'time on site'],
    format: 'duration',
  },
  {
    key: 'bounceRate',
    apiName: 'bounceRate',
    label: 'Bounce rate',
    aliases: ['bounce rate', 'bounce'],
    format: 'percent',
  },
  {
    key: 'purchases',
    apiName: 'ecommercePurchases',
    label: 'Purchases',
    aliases: ['purchase', 'purchases', 'order', 'orders', 'transaction', 'transactions'],
    format: 'number',
  },
  {
    key: 'purchaseRevenue',
    apiName: 'purchaseRevenue',
    label: 'Revenue',
    aliases: ['revenue', 'sales', 'purchase revenue'],
    format: 'currency',
  },
  {
    key: 'eventCount',
    apiName: 'eventCount',
    label: 'Event count',
    aliases: ['event count', 'events'],
    format: 'number',
  },
];

const DIMENSIONS: Record<DimensionKey, DimensionDefinition> = {
  city: { key: 'city', apiName: 'city', label: 'City' },
  source: { key: 'source', apiName: 'sessionSource', label: 'Source' },
  eventName: { key: 'eventName', apiName: 'eventName', label: 'Event name' },
};

const DEFAULT_OVERVIEW_METRICS: MetricKey[] = [
  'users',
  'pageViews',
  'avgSessionDuration',
  'bounceRate',
  'purchases',
];

export class GA4QueryService {
  private connector: GAConnector;

  constructor() {
    this.connector = new GAConnector(process.env.GOOGLE_ANALYTICS_PROPERTY_ID || '');
  }

  async getOverview(startDate: string, endDate: string): Promise<GAOverviewResponse> {
    const summaryMetrics = DEFAULT_OVERVIEW_METRICS.map((metricKey) => this.getMetric(metricKey));

    const [summaryRows, bySourceRows, topCityRows] = await Promise.all([
      this.connector.runReport({
        startDate,
        endDate,
        metrics: summaryMetrics.map((metric) => metric.apiName),
      }),
      this.connector.runReport({
        startDate,
        endDate,
        dimensions: [DIMENSIONS.source.apiName],
        metrics: summaryMetrics.map((metric) => metric.apiName),
        orderBys: [
          {
            metric: {
              metricName: this.getMetric('users').apiName,
            },
            desc: true,
          },
        ],
        limit: 12,
      }),
      this.connector.runReport({
        startDate,
        endDate,
        dimensions: [DIMENSIONS.city.apiName],
        metrics: [this.getMetric('users').apiName, this.getMetric('purchases').apiName, this.getMetric('pageViews').apiName],
        orderBys: [
          {
            metric: {
              metricName: this.getMetric('users').apiName,
            },
            desc: true,
          },
        ],
        limit: 10,
      }),
    ]);

    const summaryRow = summaryRows[0]?.metrics || {};

    return {
      dateRange: { startDate, endDate },
      summary: {
        users: summaryRow.activeUsers || 0,
        pageViews: summaryRow.screenPageViews || 0,
        avgSessionDuration: summaryRow.averageSessionDuration || 0,
        bounceRate: this.toPercent(summaryRow.bounceRate || 0),
        purchases: summaryRow.ecommercePurchases || 0,
        purchaseRevenue: summaryRow.purchaseRevenue || 0,
        eventCount: summaryRow.eventCount || 0,
      },
      bySource: bySourceRows.map((row) => ({
        source: row.dimensions.sessionSource || 'Unassigned',
        users: row.metrics.activeUsers || 0,
        pageViews: row.metrics.screenPageViews || 0,
        avgSessionDuration: row.metrics.averageSessionDuration || 0,
        bounceRate: this.toPercent(row.metrics.bounceRate || 0),
        purchases: row.metrics.ecommercePurchases || 0,
      })),
      topCities: topCityRows.map((row) => ({
        city: row.dimensions.city || 'Unknown',
        users: row.metrics.activeUsers || 0,
        pageViews: row.metrics.screenPageViews || 0,
        purchases: row.metrics.ecommercePurchases || 0,
      })),
    };
  }

  async answerQuestion(question: string, startDate: string, endDate: string): Promise<GAQuestionResponse> {
    const parsed = this.parseQuestion(question, startDate, endDate);
    const metrics = parsed.metrics.map((metric) => this.getMetric(metric));
    const dimension = parsed.dimension ? DIMENSIONS[parsed.dimension] : null;

    const rows = await this.connector.runReport({
      startDate: parsed.dateRange.startDate,
      endDate: parsed.dateRange.endDate,
      dimensions: dimension ? [dimension.apiName] : undefined,
      metrics: metrics.map((metric) => metric.apiName),
      dimensionFilter: this.buildDimensionFilter(parsed.filters),
      orderBys: dimension
        ? [
            {
              metric: {
                metricName: metrics[0].apiName,
              },
              desc: true,
            },
          ]
        : undefined,
      limit: parsed.ranking ? 10 : dimension ? 5 : 1,
    });

    const resultRows = rows.map((row) => {
      const mapped: Record<string, string | number> = {};

      if (dimension) {
        mapped[dimension.label] = row.dimensions[dimension.apiName] || 'Unknown';
      }

      metrics.forEach((metric) => {
        mapped[metric.label] = metric.format === 'percent'
          ? this.toPercent(row.metrics[metric.apiName] || 0)
          : row.metrics[metric.apiName] || 0;
      });

      return mapped;
    });

    return {
      question,
      answer: this.buildAnswer(parsed, dimension, metrics, resultRows),
      dateRange: parsed.dateRange,
      interpretation: {
        dimension: dimension?.label || null,
        metrics: metrics.map((metric) => metric.label),
        filters: parsed.filters,
        ranking: parsed.ranking,
      },
      columns: resultRows[0] ? Object.keys(resultRows[0]) : metrics.map((metric) => metric.label),
      rows: resultRows,
      chart: dimension && resultRows.length > 1
        ? {
            xKey: dimension.label,
            metricKey: metrics[0].label,
            label: metrics[0].label,
          }
        : null,
    };
  }

  private parseQuestion(question: string, fallbackStartDate: string, fallbackEndDate: string) {
    const normalized = question.toLowerCase().trim();
    const dateRange = this.resolveDateRange(normalized, fallbackStartDate, fallbackEndDate);
    const filters: Record<string, string> = {};
    const metrics = this.matchMetrics(normalized);
    const cityFilter = this.extractLocationFilter(normalized);

    if (cityFilter) {
      filters.city = cityFilter;
    }

    let dimension: DimensionKey | null = null;
    if (/\bcit(?:y|ies)\b/.test(normalized) || filters.city) {
      dimension = filters.city && !/(top|which|cities)/.test(normalized) ? null : 'city';
    } else if (/\bsource\b|\bchannel\b/.test(normalized)) {
      dimension = 'source';
    } else if (/\bevent\b/.test(normalized)) {
      dimension = 'eventName';
    }

    const ranking = /\b(top|which|best|highest|most|from where)\b/.test(normalized) || (!!dimension && /\bcities\b/.test(normalized));

    return {
      dateRange,
      dimension,
      metrics,
      filters,
      ranking,
    };
  }

  private resolveDateRange(question: string, fallbackStartDate: string, fallbackEndDate: string) {
    const today = new Date();

    if (/\byesterday\b/.test(question)) {
      const yesterday = format(subDays(today, 1), 'yyyy-MM-dd');
      return { startDate: yesterday, endDate: yesterday };
    }

    if (/\btoday\b/.test(question)) {
      const current = format(today, 'yyyy-MM-dd');
      return { startDate: current, endDate: current };
    }

    const lastDaysMatch = question.match(/last\s+(\d+)\s+days?/);
    if (lastDaysMatch) {
      const days = Number(lastDaysMatch[1]);
      return {
        startDate: format(subDays(today, Math.max(days - 1, 0)), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    }

    if (/last\s+7\s+days/.test(question)) {
      return {
        startDate: format(subDays(today, 6), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    }

    return { startDate: fallbackStartDate, endDate: fallbackEndDate };
  }

  private matchMetrics(question: string): MetricKey[] {
    const matches = METRICS.filter((metric) => metric.aliases.some((alias) => question.includes(alias))).map((metric) => metric.key);

    if (!matches.length) {
      return ['users'];
    }

    return [...new Set(matches)];
  }

  private extractLocationFilter(question: string) {
    if (/\bcities\b/.test(question)) {
      return '';
    }

    const match = question.match(/\b(?:from|form)\s+([a-z][a-z\s]+?)(?=\s+(?:yesterday|today|last|with|what|how|which|for|did|do|was|were)\b|[?.!,]|$)/);
    if (!match) {
      return '';
    }

    return match[1]
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private buildDimensionFilter(filters: Record<string, string>) {
    if (filters.city) {
      return {
        filter: {
          fieldName: DIMENSIONS.city.apiName,
          stringFilter: {
            matchType: 'EXACT',
            value: filters.city,
            caseSensitive: false,
          },
        },
      };
    }

    return undefined;
  }

  private buildAnswer(
    parsed: ReturnType<GA4QueryService['parseQuestion']>,
    dimension: DimensionDefinition | null,
    metrics: MetricDefinition[],
    rows: Array<Record<string, string | number>>
  ) {
    const rangeLabel = parsed.dateRange.startDate === parsed.dateRange.endDate
      ? parsed.dateRange.startDate
      : `${parsed.dateRange.startDate} to ${parsed.dateRange.endDate}`;

    if (!rows.length) {
      return `No GA4 data matched that question for ${rangeLabel}.`;
    }

    const firstRow = rows[0];

    if (!dimension) {
      const details = metrics
        .map((metric) => `${metric.label.toLowerCase()} ${this.formatValue(firstRow[metric.label] as number, metric.format)}`)
        .join(', ');

      if (parsed.filters.city) {
        return `${parsed.filters.city} recorded ${details} for ${rangeLabel}.`;
      }

      return `For ${rangeLabel}, the result is ${details}.`;
    }

    const leader = String(firstRow[dimension.label] || 'Unknown');
    const primaryMetric = metrics[0];
    const primaryValue = this.formatValue(firstRow[primaryMetric.label] as number, primaryMetric.format);

    if (parsed.ranking) {
      return `${leader} leads by ${primaryMetric.label.toLowerCase()} with ${primaryValue} for ${rangeLabel}.`;
    }

    const metricSummary = metrics
      .map((metric) => `${metric.label.toLowerCase()} ${this.formatValue(firstRow[metric.label] as number, metric.format)}`)
      .join(', ');

    return `${leader} shows ${metricSummary} for ${rangeLabel}.`;
  }

  private formatValue(value: number, formatType: MetricDefinition['format']) {
    switch (formatType) {
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'duration': {
        const totalSeconds = Math.round(value);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      }
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value);
      default:
        return new Intl.NumberFormat('en-US').format(Math.round(value));
    }
  }

  private toPercent(value: number) {
    return value <= 1 ? value * 100 : value;
  }

  private getMetric(metricKey: MetricKey) {
    const metric = METRICS.find((entry) => entry.key === metricKey);
    if (!metric) {
      throw new Error(`Unsupported GA4 metric: ${metricKey}`);
    }

    return metric;
  }
}

export default GA4QueryService;