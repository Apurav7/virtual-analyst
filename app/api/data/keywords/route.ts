import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/data/keywords
 * Fetch top search keywords and performance data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate query parameters required' },
        { status: 400 }
      );
    }

    const { queryAll } = await import('@/lib/db/client');

    // Get top keywords by impressions
    const keywords = await queryAll(
      `SELECT keyword, SUM(impressions) as impressions, SUM(clicks) as clicks,
              AVG(ctr) as ctr, AVG(avg_position) as avg_position
       FROM search_keywords
       WHERE date BETWEEN $1 AND $2
       GROUP BY keyword
       ORDER BY impressions DESC
       LIMIT $3`,
      [startDate, endDate, limit]
    );

    // Categorize keywords by position
    const byPosition = {
      top10: keywords.filter((k: any) => k.avg_position <= 10),
      top20: keywords.filter((k: any) => k.avg_position > 10 && k.avg_position <= 20),
      top50: keywords.filter((k: any) => k.avg_position > 20 && k.avg_position <= 50),
      below50: keywords.filter((k: any) => k.avg_position > 50),
    };

    // Find opportunities (high impressions, low clicks)
    const opportunities = keywords
      .filter((k: any) => k.impressions > 100 && k.clicks < 10)
      .slice(0, 20);

    return NextResponse.json({
      startDate,
      endDate,
      totalKeywords: keywords.length,
      byPosition,
      opportunities,
      allKeywords: keywords,
    });
  } catch (error) {
    console.error('Keywords API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}
