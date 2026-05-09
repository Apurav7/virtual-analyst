import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/db/client';
import { subDays, format } from 'date-fns';

/**
 * GET /api/dashboard
 * Fetch dashboard data for a specific date
 * Returns real data from database, or sample data if no real data available
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Try to fetch real data from database
    let dashboardData: any = null;
    
    try {
      const metrics = await queryAll(
        `SELECT * FROM daily_metrics WHERE date = $1 ORDER BY revenue DESC`,
        [date]
      );

      const keywords = await queryAll(
        `SELECT * FROM search_keywords WHERE date = $1 ORDER BY impressions DESC LIMIT 10`,
        [date]
      );

      const insights = await queryAll(
        `SELECT * FROM ai_insights WHERE date = $1 ORDER BY impact_score DESC LIMIT 5`,
        [date]
      );

      if (metrics.length > 0 || keywords.length > 0) {
        // Transform database data to API format
        dashboardData = {
          date: date,
          metrics: metrics.map((m: any) => ({
            traffic_source: m.traffic_source,
            users: m.users,
            sessions: m.sessions,
            transactions: m.transactions,
            revenue: m.revenue,
            bounce_rate: m.bounce_rate,
            avg_session_duration: m.avg_session_duration
          })),
          keywords: keywords.map((k: any) => ({
            keyword: k.keyword,
            position: k.avg_position,
            impressions: k.impressions,
            clicks: k.clicks,
            ctr: k.ctr
          })),
          insights: insights.map((i: any) => ({
            title: i.title,
            insight: i.insight,
            recommendation: i.recommendation,
            priority: i.priority,
            impact_score: i.impact_score
          }))
        };
      }
    } catch (dbError) {
      console.warn('Database query failed, using sample data:', dbError);
    }

    // Fall back to sample data if database is empty or unavailable
    if (!dashboardData) {
      dashboardData = {
      date: date,
      metrics: [
        {
          traffic_source: 'Organic Search',
          users: 1250,
          sessions: 1580,
          transactions: 85,
          revenue: 4250.50,
          bounce_rate: 32.5,
          avg_session_duration: 245
        },
        {
          traffic_source: 'Paid Ads',
          users: 890,
          sessions: 1120,
          transactions: 95,
          revenue: 5120.75,
          bounce_rate: 28.3,
          avg_session_duration: 320
        },
        {
          traffic_source: 'Direct',
          users: 450,
          sessions: 520,
          transactions: 32,
          revenue: 1850.25,
          bounce_rate: 45.2,
          avg_session_duration: 180
        }
      ],
      insights: [
        {
          title: 'Strong Paid Ad Performance',
          insight: 'Paid ads are generating 52% higher revenue per session compared to organic traffic',
          recommendation: 'Increase budget allocation to top-performing ad campaigns',
          priority: 'high',
          impact_score: 92
        },
        {
          title: 'Organic Traffic Opportunity',
          insight: 'Organic search has room for improvement with targeted keyword optimization',
          recommendation: 'Focus on long-tail keywords with high commercial intent',
          priority: 'medium',
          impact_score: 78
        },
        {
          title: 'Bounce Rate Alert',
          insight: 'Direct traffic has a 45.2% bounce rate, indicating potential landing page issues',
          recommendation: 'Review and optimize landing pages for direct traffic users',
          priority: 'medium',
          impact_score: 65
        }
      ],
      keywords: [
        { keyword: 'farmlokal products', position: 3, impressions: 580, clicks: 145, ctr: 25 },
        { keyword: 'organic farming supplies', position: 5, impressions: 420, clicks: 92, ctr: 22 },
        { keyword: 'local sustainable products', position: 8, impressions: 310, clicks: 48, ctr: 15 },
        { keyword: 'farm to table marketplace', position: 12, impressions: 250, clicks: 35, ctr: 14 }
      ]
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
