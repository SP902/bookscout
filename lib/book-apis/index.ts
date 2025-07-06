import { Book } from '../types';
import { fetchBooksFromGoogle } from './google-books';
import { getEmbedding, cosineSimilarity } from './embedding';
import { extractThemes } from './theme-extract';
import type { UserPreferences } from '../recommendation';
import { calculateHybridBookScore } from '../recommendation';

// Re-export for direct access
export { fetchBooksFromGoogle } from './google-books';

// Rank books by user history/preferences using weighted scoring
export function rankBooksByUserHistory(books: Book[], userPreferences?: UserPreferences): Book[] {
  if (!userPreferences) return books;
  return books
    .map(book => ({
      book,
      score: calculateHybridBookScore(book as any, userPreferences) // Book needs to be cast for hybrid scoring
    }))
    .sort((a, b) => b.score - a.score)
    .map(r => r.book);
}

// In the future, add more sources here
export async function fetchBooksAggregated(query: string, userPreferences?: UserPreferences, mode: 'Fresh' | 'Smart' = 'Fresh'): Promise<Book[]> {
  // For now, only Google Books
  const googleBooks = await fetchBooksFromGoogle(query, mode);
  // You could merge/deduplicate results from multiple sources here
  if (userPreferences) {
    return rankBooksByUserHistory(googleBooks, userPreferences);
  }
  return googleBooks;
}

// Hybrid search: fetch books, rank by embedding similarity, extract themes if needed
export async function fetchAndRankBooksWithEmbeddings(prompt: string, mode: 'Fresh' | 'Smart') {
  // 1. Extract keywords and fetch books
  const books = await fetchBooksFromGoogle(prompt, mode);
  if (!books.length) return { books: [], promptEmbedding: [], themes: '' };

  // 2. Generate embedding for user prompt
  let promptEmbedding: number[] = [];
  try {
    promptEmbedding = await getEmbedding(prompt);
  } catch (e) {
    // fallback: return books as is
    return { books, promptEmbedding: [], themes: '' };
  }

  // 3. Generate embeddings for book descriptions
  const bookEmbeddings: (number[] | null)[] = await Promise.all(
    books.map(b => b.description ? getEmbedding(b.description) : Promise.resolve(null))
  );

  // 4. Rank books by cosine similarity
  const ranked = books
    .map((b, i) => ({ book: b, sim: bookEmbeddings[i] ? cosineSimilarity(promptEmbedding, bookEmbeddings[i]!) : -1 }))
    .sort((a, b) => b.sim - a.sim)
    .map(r => r.book);

  // 5. For Smart mode, extract themes
  let themes = '';
  if (mode === 'Smart') {
    try {
      themes = await extractThemes(prompt);
    } catch {}
  }

  return { books: ranked, promptEmbedding, themes };
} 