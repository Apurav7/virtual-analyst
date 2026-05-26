import { NextRequest, NextResponse } from 'next/server';

const TRANSLITERATION_URL = 'https://inputtools.google.com/request?itc=hi-t-i0-und&num=5&text=';

function isRomanHindiCandidate(topic: string) {
  return /[a-z]/i.test(topic) && !/[\u0900-\u097F]/.test(topic);
}

async function transliterateTopic(topic: string) {
  if (!isRomanHindiCandidate(topic)) {
    return topic;
  }

  const response = await fetch(`${TRANSLITERATION_URL}${encodeURIComponent(topic)}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return topic;
  }

  const data = (await response.json()) as [string, Array<[string, string[]?]>?];

  if (data[0] !== 'SUCCESS') {
    return topic;
  }

  const bestMatch = data[1]?.[0]?.[1]?.[0];
  return bestMatch || topic;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { topics?: string[] };
    const topics = Array.isArray(body.topics) ? body.topics : [];
    const transliteratedTopics = await Promise.all(topics.map((topic) => transliterateTopic(topic)));

    return NextResponse.json({ topics: transliteratedTopics });
  } catch {
    return NextResponse.json({ topics: [] }, { status: 400 });
  }
}