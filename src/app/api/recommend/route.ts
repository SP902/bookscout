import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, mode } = await req.json();
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Prompt required.' }, { status: 400 });
  }
  if (mode === 'Fresh') {
    // No logging, no storage, just return mock results
    return NextResponse.json({
      llmResponse: `Here are some book recommendations for: "${prompt}" (Fresh mode, no data stored)`,
      books: [
        { title: 'Book 1 (Fresh)' },
        { title: 'Book 2 (Fresh)' },
        { title: 'Book 3 (Fresh)' },
      ],
    });
  } else {
    // Simulate logging to database and personalized results
    // (In real app, store prompt and user info here)
    return NextResponse.json({
      llmResponse: `Personalized recommendations for: "${prompt}" (Smart mode, data logged)`,
      books: [
        { title: 'Book 1 (Smart)' },
        { title: 'Book 2 (Smart)' },
        { title: 'Book 3 (Smart)' },
      ],
    });
  }
} 