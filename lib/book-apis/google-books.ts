import { Book } from '../types';

// Map a single Google Books API item to our simplified Book interface
export function mapGoogleBookToBook(item: any): Book {
  const volumeInfo = item.volumeInfo || {};
  // Prefer large/extraLarge, then thumbnail
  const cover_image_url =
    volumeInfo.imageLinks?.large ||
    volumeInfo.imageLinks?.extraLarge ||
    volumeInfo.imageLinks?.thumbnail ||
    null;
  const thumbnail_url = volumeInfo.imageLinks?.thumbnail || cover_image_url || null;
  return {
    isbn_13: (volumeInfo.industryIdentifiers || []).find((id: any) => id.type === 'ISBN_13')?.identifier || '',
    isbn_10: (volumeInfo.industryIdentifiers || []).find((id: any) => id.type === 'ISBN_10')?.identifier || null,
    google_books_id: item.id || null,
    title: volumeInfo.title || '',
    subtitle: volumeInfo.subtitle || null,
    authors: volumeInfo.authors || null,
    primary_author: volumeInfo.authors ? volumeInfo.authors[0] : null,
    genre: (volumeInfo.categories && volumeInfo.categories[0]) || null,
    categories: volumeInfo.categories || null,
    description: volumeInfo.description || null,
    page_count: volumeInfo.pageCount || null,
    published_date: volumeInfo.publishedDate || null,
    publisher: volumeInfo.publisher || null,
    average_rating: volumeInfo.averageRating || null,
    thumbnail_url,
    cover_image_url,
  };
}

// Extract keywords from a user query for better Google Books search
function extractKeywords(query: string): string {
  // Simple keyword extraction: remove stopwords, keep nouns/verbs (very basic)
  // For now, just remove common stopwords and join remaining words
  const stopwords = [
    'the', 'a', 'an', 'of', 'for', 'to', 'and', 'in', 'on', 'with', 'by', 'about', 'from', 'at', 'as', 'is', 'are', 'was', 'were', 'be', 'this', 'that', 'it', 'you', 'your', 'my', 'me', 'i', 'we', 'us', 'our', 'they', 'them', 'their', 'he', 'she', 'his', 'her', 'but', 'or', 'so', 'if', 'then', 'than', 'too', 'very', 'just', 'can', 'will', 'would', 'should', 'could', 'do', 'does', 'did', 'have', 'has', 'had', 'not', 'no', 'yes', 'all', 'any', 'some', 'more', 'most', 'many', 'few', 'which', 'what', 'who', 'whom', 'whose', 'how', 'when', 'where', 'why', 'because', 'while', 'during', 'after', 'before', 'over', 'under', 'again', 'once', 'here', 'there', 'out', 'up', 'down', 'off', 'above', 'below', 'into', 'through', 'between', 'among', 'each', 'other', 'such', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
  ];
  return query
    .split(/\s+/)
    .filter(word => !stopwords.includes(word.toLowerCase()))
    .join(' ');
}

// AI-powered keyword extraction for Smart Mode
async function extractKeywordsWithAI(userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    return extractKeywords(userPrompt); // Fallback to basic extraction
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'Convert natural language book requests into optimal Google Books API search terms. Extract genres, themes, keywords, authors. Return only search keywords.'
        }, {
          role: 'user',
          content: userPrompt
        }],
        max_tokens: 40,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return extractKeywords(userPrompt); // Fallback to basic extraction
    }

    const data = await response.json();
    const aiKeywords = data.choices?.[0]?.message?.content?.trim();
    
    if (aiKeywords) {
      return aiKeywords;
    } else {
      return extractKeywords(userPrompt); // Fallback to basic extraction
    }
  } catch (err) {
    console.error('Error calling OpenAI for keyword extraction:', err);
    return extractKeywords(userPrompt); // Fallback to basic extraction
  }
}

// Fetch books from Google Books API and map to Book[]
export async function fetchBooksFromGoogle(query: string, mode: 'Fresh' | 'Smart' = 'Fresh'): Promise<Book[]> {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_BOOKS_API_KEY is not set');
      return [];
    }

    // Use AI-powered keyword extraction for Smart Mode, basic extraction for Fresh Mode
    const keywords = mode === 'Smart' 
      ? await extractKeywordsWithAI(query)
      : extractKeywords(query);

    // Use updated params for Google Books API
    const params = new URLSearchParams({
      q: keywords,
      maxResults: '40',
      orderBy: 'relevance',
      printType: 'books',
      key: apiKey,
    });
    const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      // Handle rate limits or errors
      console.error('Google Books API error:', res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];
    // Filter for English books only, with a valid cover image
    const englishBooks = data.items
      .filter((item: any) => item.volumeInfo?.language === 'en')
      .map(mapGoogleBookToBook)
      .filter((book: Book) => book.cover_image_url); // Only books with a cover image
    return englishBooks.slice(0, 3); // Limit to 3 books
  } catch (err) {
    // Handle network or parsing errors
    console.error('Error fetching from Google Books API:', err);
    return [];
  }
} 