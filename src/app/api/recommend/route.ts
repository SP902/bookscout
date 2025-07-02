import { NextRequest, NextResponse } from 'next/server';
import { fetchAndRankBooksWithEmbeddings } from '../../../../lib/book-apis';
import { storePromptEmbedding } from '../../../../lib/supabase';
import crypto from 'crypto';

async function getOpenAIResponse({ mode, books, prompt, themes }: { mode: string, books: any[], prompt: string, themes?: string }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return '[AI unavailable: missing API key]';
  if (!books?.length) return 'No books found for your request.';

  // Prepare system prompt and user message
  let systemPrompt = '';
  let userMessage = '';
  if (mode === 'Fresh') {
    systemPrompt = 'You are a friendly book expert. Explain in a warm, conversational way why these books are a great fit for the user\'s request.';
    userMessage = `Here are some books:\n\n${books.map((b, i) => `${i+1}. ${b.title} by ${b.authors?.join(', ') || 'Unknown author'}\n${b.description || ''}`).join('\n\n')}`;
  } else {
    systemPrompt = 'You are a personalized reading curator. Give tailored, insightful reasons why each book matches the user\'s interests, as if you know their reading history.';
    userMessage = `User is interested in: ${themes || '[unknown themes]'}\n\nBooks:\n\n${books.map((b, i) => `${i+1}. ${b.title} by ${b.authors?.join(', ') || 'Unknown author'}\n${b.description || ''}`).join('\n\n')}`;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 220,
        temperature: 0.8,
      }),
    });
    if (!res.ok) throw new Error('OpenAI error');
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '[AI did not return a response]';
  } catch (err) {
    return '[AI unavailable: could not generate explanation]';
  }
}

export async function POST(req: NextRequest) {
  const { prompt, mode, userId } = await req.json();
  if (!prompt || typeof prompt !== 'string' || !mode) {
    return NextResponse.json({ error: 'Prompt and mode required.' }, { status: 400 });
  }

  // Hybrid search: fetch, embed, rank, extract themes
  const { books, promptEmbedding, themes } = await fetchAndRankBooksWithEmbeddings(prompt, mode);

  // Privacy: Fresh mode never stores or sends raw prompt externally
  let llmResponse = '';
  if (mode === 'Fresh') {
    llmResponse = await getOpenAIResponse({ mode, books, prompt: '', themes: '' });
  } else {
    // Smart mode: store hashed prompt+embedding, send only themes to OpenAI
    if (userId && promptEmbedding.length) {
      const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');
      await storePromptEmbedding(userId, promptHash, promptEmbedding);
    }
    llmResponse = await getOpenAIResponse({ mode, books, prompt: '', themes });
  }

  return NextResponse.json({
    llmResponse,
    books,
  });
} 