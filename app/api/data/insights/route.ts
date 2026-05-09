import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/data/insights
 * Fetch AI-generated insights for a date or date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!date && (!startDate || !endDate)) {
      return NextResponse.json(
        { error: 'Provide either date or startDate+endDate' },
        { status: 400 }
      );
    }

    const { queryAll } = await import('@/lib/db/client');

    let query = 'SELECT * FROM ai_insights';
    const params: any[] = [];

    if (date) {
      query += ' WHERE date = $1';
      params.push(date);
    } else {
      query += ' WHERE date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    if (category) {
      query += params.length > 0 ? ' AND category = $' + (params.length + 1) : ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY impact_score DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const insights = await queryAll(query, params);

    return NextResponse.json({
      date,
      startDate,
      endDate,
      category,
      count: insights.length,
      insights,
    });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
