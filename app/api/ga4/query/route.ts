import { NextRequest, NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';
import GA4QueryService from '@/lib/services/ga4-query.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ga4Service = new GA4QueryService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = body?.question?.trim();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const today = new Date();
    const endDate = body?.endDate || format(today, 'yyyy-MM-dd');
    const startDate = body?.startDate || format(subDays(today, 6), 'yyyy-MM-dd');

    const response = await ga4Service.answerQuestion(question, startDate, endDate);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to answer GA4 question',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}