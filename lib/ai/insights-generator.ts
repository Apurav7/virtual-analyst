import OpenAI from 'openai';

/**
 * AI-Powered Insights Generator
 * Uses OpenAI to analyze data and generate actionable recommendations
 */

export interface InsightInput {
  date: string;
  category?: string;
  trafficMetrics: Record<string, any>;
  categoryMetrics: Record<string, any>;
  topKeywords: Array<{ keyword: string; impressions: number; clicks: number }>;
  topPages: Array<{ page: string; conversion_rate: number; revenue: number }>;
  userJourneyData: {
    avgSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
}

export interface GeneratedInsight {
  title: string;
  insight: string;
  recommendation: string;
  metric: string;
  priority: 'high' | 'medium' | 'low';
  impact_score: number;
}

class InsightsGenerator {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
    });
  }

  /**
   * Generate daily insights from aggregated metrics
   */
  async generateDailyInsights(input: InsightInput): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    try {
      // Generate category-specific insights
      if (input.category) {
        const categoryInsight = await this.analyzeCategoryPerformance(input);
        insights.push(categoryInsight);
      }

      // Generate traffic source comparison
      const trafficInsight = await this.analyzeTrafficSources(input);
      insights.push(trafficInsight);

      // Generate conversion optimization recommendations
      const conversionInsight = await this.analyzeConversions(input);
      insights.push(conversionInsight);

      // Generate user behavior insights
      const behaviorInsight = await this.analyzeUserBehavior(input);
      insights.push(behaviorInsight);

      // Generate keyword opportunity insights
      const keywordInsight = await this.analyzeKeywordOpportunities(input);
      insights.push(keywordInsight);

      return insights.filter((i) => i !== null) as GeneratedInsight[];
    } catch (error) {
      console.error('Error generating insights:', error);
      throw new Error('Failed to generate AI insights');
    }
  }

  /**
   * Analyze category performance
   */
  private async analyzeCategoryPerformance(input: InsightInput): Promise<GeneratedInsight> {
    const prompt = `
You are an ecommerce analytics expert analyzing category performance data.

Category: ${input.category}
Metrics:
- Traffic: ${input.categoryMetrics.traffic_volume || 0} users
- Conversion Rate: ${input.categoryMetrics.conversion_rate || 0}%
- Average Order Value: $${input.categoryMetrics.avg_order_value || 0}
- Total Revenue: $${input.categoryMetrics.total_revenue || 0}
- ROAs: ${input.categoryMetrics.roas || 0}%

Provide:
1. A brief title (max 10 words)
2. Key insight about this category's performance
3. One specific actionable recommendation
Format as JSON: { title, insight, recommendation, metric, priority, impact_score }
priority should be 'high', 'medium', or 'low'
impact_score should be 0-100
`;

    const response = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    return {
      title: parsed.title,
      insight: parsed.insight,
      recommendation: parsed.recommendation,
      metric: `Category: ${input.category}`,
      priority: parsed.priority || 'medium',
      impact_score: parsed.impact_score || 50,
    };
  }

  /**
   * Analyze traffic sources
   */
  private async analyzeTrafficSources(input: InsightInput): Promise<GeneratedInsight> {
    const organicData = input.trafficMetrics.organic || {};
    const paidData = input.trafficMetrics.paid || {};

    const prompt = `
You are an ecommerce analytics expert comparing traffic sources.

Organic Search:
- Users: ${organicData.users || 0}
- Sessions: ${organicData.sessions || 0}
- Conversion Rate: ${organicData.conversion_rate || 0}%
- Revenue: $${organicData.revenue || 0}

Paid Ads:
- Clicks: ${paidData.clicks || 0}
- Cost: $${paidData.cost || 0}
- Conversions: ${paidData.conversions || 0}
- ROAs: ${paidData.roas || 0}%

Provide comparative insights and recommendation.
Format as JSON: { title, insight, recommendation, metric, priority, impact_score }
`;

    const response = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    return {
      title: parsed.title,
      insight: parsed.insight,
      recommendation: parsed.recommendation,
      metric: 'Traffic Source Comparison',
      priority: parsed.priority || 'high',
      impact_score: parsed.impact_score || 70,
    };
  }

  /**
   * Analyze conversion opportunities
   */
  private async analyzeConversions(input: InsightInput): Promise<GeneratedInsight> {
    const conversionRate = input.userJourneyData.conversionRate || 0;
    const avgSessionDuration = input.userJourneyData.avgSessionDuration || 0;
    const bounceRate = input.userJourneyData.bounceRate || 0;

    const prompt = `
You are a conversion rate optimization specialist.

Current Metrics:
- Conversion Rate: ${conversionRate.toFixed(2)}%
- Average Session Duration: ${(avgSessionDuration / 60).toFixed(1)} minutes
- Bounce Rate: ${bounceRate.toFixed(2)}%
- Top Pages: ${input.topPages.map((p) => p.page).join(', ')}

Provide conversion optimization insights and recommendations.
Format as JSON: { title, insight, recommendation, metric, priority, impact_score }
`;

    const response = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    return {
      title: parsed.title,
      insight: parsed.insight,
      recommendation: parsed.recommendation,
      metric: 'Conversion Optimization',
      priority: parsed.priority || 'high',
      impact_score: parsed.impact_score || 75,
    };
  }

  /**
   * Analyze user behavior patterns
   */
  private async analyzeUserBehavior(input: InsightInput): Promise<GeneratedInsight> {
    const prompt = `
You are a user behavior analyst for ecommerce sites.

User Journey Data:
- Average Session Duration: ${(input.userJourneyData.avgSessionDuration / 60).toFixed(1)} minutes
- Bounce Rate: ${input.userJourneyData.bounceRate.toFixed(2)}%
- Conversion Rate: ${input.userJourneyData.conversionRate.toFixed(2)}%

Provide insights about user behavior and engagement.
Format as JSON: { title, insight, recommendation, metric, priority, impact_score }
`;

    const response = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    return {
      title: parsed.title,
      insight: parsed.insight,
      recommendation: parsed.recommendation,
      metric: 'User Behavior & Engagement',
      priority: parsed.priority || 'medium',
      impact_score: parsed.impact_score || 60,
    };
  }

  /**
   * Analyze keyword opportunities
   */
  private async analyzeKeywordOpportunities(input: InsightInput): Promise<GeneratedInsight> {
    const lowClickKeywords = input.topKeywords
      .filter((k) => k.impressions > 100 && k.clicks < 10)
      .slice(0, 5)
      .map((k) => `"${k.keyword}"`)
      .join(', ');

    const prompt = `
You are an SEO specialist analyzing keyword performance.

Low-Click Opportunities (high impressions, low clicks):
${lowClickKeywords || 'None identified'}

Top Keywords: ${input.topKeywords.slice(0, 5).map((k) => k.keyword).join(', ')}

Provide keyword optimization insights.
Format as JSON: { title, insight, recommendation, metric, priority, impact_score }
`;

    const response = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    return {
      title: parsed.title,
      insight: parsed.insight,
      recommendation: parsed.recommendation,
      metric: 'Keyword Opportunities',
      priority: parsed.priority || 'medium',
      impact_score: parsed.impact_score || 65,
    };
  }
}

export default InsightsGenerator;
