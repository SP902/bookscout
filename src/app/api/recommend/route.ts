import { NextRequest, NextResponse } from 'next/server';
import { fetchBooksAggregated, fetchAndRankBooksWithEmbeddings, fetchBooksFromGoogle } from '../../../../lib/book-apis';
import { storePromptEmbedding, getUserInteractionHistory } from '../../../../lib/supabase';
import { analyzeUserPreferences, calculateHybridBookScore } from '../../../../lib/recommendation';
import { toBook, type BookIndex } from '../../../../lib/types';
import crypto from 'crypto';

// Utility to clean greetings and 'BookScout' from prompt
function cleanPrompt(input: string): string {
  return input
    .replace(/^(hey|hi|hello|yo|greetings)[,\s]+/i, '')
    .replace(/bookscout[,!\s]*/gi, '')
    .replace(/^get me[,\s]*/i, '')
    .replace(/^can you[,\s]*/i, '')
    .replace(/^please[,\s]*/i, '')
    .trim();
}

async function getOpenAIResponse({ mode, books, prompt, themes, userPreferences }: { mode: string, books: any[], prompt: string, themes?: string, userPreferences?: any }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return '[AI unavailable: missing API key]';
  if (!books?.length) return 'No books found for your request.';

  // Prepare system prompt and user message
  let systemPrompt = '';
  let userMessage = '';
  if (mode === 'Fresh') {
    systemPrompt = 'You are a friendly, enthusiastic librarian. For each book, give a short, warm, and casual recommendation (2-3 sentences max). Avoid sounding like an AI or using formulaic language. Never reference the user directly.';
    userMessage = `Here are some books to recommend:\n\n${books.map((b, i) => `${i+1}. ${b.title} by ${b.authors?.join(', ') || 'Unknown author'}\n${b.description || ''}`).join('\n\n')}`;
  } else {
    systemPrompt = 'You are a friendly, enthusiastic librarian who knows the user\'s reading tastes. For each book, give a short, casual, and personal recommendation (2-3 sentences max). Reference the user\'s favorite genres or authors if possible. Use phrases like \'You\'ll love this!\' or \'Since you enjoy fantasy...\'. Avoid sounding like an AI or using formulaic language.';
    userMessage = `User loves: ${userPreferences?.topGenres || '[unknown genres]'}; Favorite authors: ${userPreferences?.topAuthors || '[unknown authors]'}\n\nRecommend these books:\n\n${books.map((b, i) => `${i+1}. ${b.title} by ${b.authors?.join(', ') || 'Unknown author'}\n${b.description || ''}`).join('\n\n')}`;
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
        max_tokens: 120,
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
  let { prompt, mode, userId } = await req.json();
  if (!prompt || typeof prompt !== 'string' || !mode) {
    return NextResponse.json({ error: 'Prompt and mode required.' }, { status: 400 });
  }
  prompt = cleanPrompt(prompt);

  let books: any[] = [];
  let promptEmbedding: number[] = [];
  let themes = '';
  let userPreferences: any = undefined;

  if (mode === 'Fresh') {
    // Privacy: Fresh mode uses simple Google Books API search (no embeddings, no ranking)
    books = await fetchBooksFromGoogle(prompt, 'Fresh');
    // No embeddings, no themes for privacy
    promptEmbedding = [];
    themes = '';
  } else {
    // Smart mode: use fetchAndRankBooksWithEmbeddings for consistency with Fresh mode
    const result = await fetchAndRankBooksWithEmbeddings(prompt, mode);
    books = result.books;
    promptEmbedding = result.promptEmbedding;
    themes = result.themes;
    
    // If user has history, apply additional personalization
    if (userId) {
      const { data: interactions } = await getUserInteractionHistory(userId);
      if (interactions && interactions.length) {
        // Build bookIndexMap for scoring
        const bookIndexMap: Record<string, BookIndex> = {};
        for (const b of books) {
          if (b.isbn_13) {
            bookIndexMap[b.isbn_13] = {
              ...b,
              // Add required BookIndex fields that aren't in Book
              asin: null,
              language: null,
              ratings_count: null,
              popularity_score: null,
              preview_link: null,
              amazon_affiliate_url: null,
              flipkart_affiliate_url: null,
              audible_affiliate_url: null,
              affiliate_disclosure_required: null,
              content_embedding: null,
              genre_embedding: null,
              content_hash: null,
              embedding_model_version: null,
              embedding_computed_at: null,
              quality_score: null,
              search_text: null,
              tags: null,
              data_source: null,
              last_updated_at: null,
              is_active: null,
              is_available: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          }
        }
        
        const prefs = analyzeUserPreferences(interactions, bookIndexMap);
        // For OpenAI context
        userPreferences = {
          topGenres: Object.entries(prefs.likedGenres).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g).join(', '),
          topAuthors: Object.entries(prefs.likedAuthors).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a).join(', '),
        };
        // Apply hybrid scoring to re-rank books
        books = books
          .map(book => ({ book, score: calculateHybridBookScore(bookIndexMap[book.isbn_13], prefs) }))
          .sort((a, b) => b.score - a.score)
          .map(r => r.book)
          .slice(0, 3); // Return top 3
      }
    }
  }

  // Store prompt embedding for Smart mode
  if (mode === 'Smart' && userId) {
    try {
      promptEmbedding = [];
      const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');
      await storePromptEmbedding(userId, promptHash, promptEmbedding);
    } catch {}
  }

  let llmResponse = '';
  if (mode === 'Fresh') {
    llmResponse = await getOpenAIResponse({ mode, books, prompt: '', themes: '' });
  } else {
    llmResponse = await getOpenAIResponse({ mode, books, prompt: '', themes, userPreferences });
  }

  return NextResponse.json({
    llmResponse,
    books,
  });
} 