import { NextRequest, NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';
import GA4QueryService from '@/lib/services/ga4-query.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ga4Service = new GA4QueryService();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const today = new Date();
    const endDate = searchParams.get('endDate') || format(today, 'yyyy-MM-dd');
    const startDate = searchParams.get('startDate') || format(subDays(today, 6), 'yyyy-MM-dd');

    const response = await ga4Service.getOverview(startDate, endDate);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch live GA4 dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}