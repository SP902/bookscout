import type { UserInteraction, BookIndex } from './types';
import { cosineSimilarity } from './book-apis/embedding';

export interface UserPreferences {
  likedGenres: Record<string, number>;
  dislikedGenres: Record<string, number>;
  likedAuthors: Record<string, number>;
  dislikedAuthors: Record<string, number>;
  likedCategories: Record<string, number>;
  dislikedCategories: Record<string, number>;
  likedTags: Record<string, number>;
  dislikedTags: Record<string, number>;
  userEmbedding: number[] | null;
}

/**
 * Analyze user preferences from their interaction history.
 * Extracts and weights genres, authors, categories, tags.
 * Aggregates user embedding as the average of liked book embeddings (1536-dim).
 * Only considers interactions that would be tracked in Smart mode.
 * Recent interactions (last 30 days) are weighted 2x.
 */
export function analyzeUserPreferences(interactions: UserInteraction[], bookIndexMap?: Record<string, BookIndex>): UserPreferences {
  const likedGenres: Record<string, number> = {};
  const dislikedGenres: Record<string, number> = {};
  const likedAuthors: Record<string, number> = {};
  const dislikedAuthors: Record<string, number> = {};
  const likedCategories: Record<string, number> = {};
  const dislikedCategories: Record<string, number> = {};
  const likedTags: Record<string, number> = {};
  const dislikedTags: Record<string, number> = {};
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const likedEmbeddings: number[][] = [];

  for (const interaction of interactions) {
    if (!interaction.interaction_type) continue;
    const smartModeTypes = [
      'add_to_list', 'show_more_like', 'hide_similar', 'viewed', 'clicked', 'saved', 'removed', 'rating_given', 'details_viewed'
    ];
    if (!smartModeTypes.includes(interaction.interaction_type)) continue;

    const signal = interaction.signal_strength ?? 0;
    if (signal === 0) continue;
    const createdAt = new Date(interaction.created_at).getTime();
    const isRecent = now - createdAt < THIRTY_DAYS_MS;
    const weight = isRecent ? 2 : 1;

    // Genre
    if (interaction.book_genre) {
      if (signal > 0) {
        likedGenres[interaction.book_genre] = (likedGenres[interaction.book_genre] || 0) + signal * weight;
      } else {
        dislikedGenres[interaction.book_genre] = (dislikedGenres[interaction.book_genre] || 0) + Math.abs(signal) * weight;
      }
    }
    // Authors
    if (interaction.book_author) {
      if (signal > 0) {
        likedAuthors[interaction.book_author] = (likedAuthors[interaction.book_author] || 0) + signal * weight;
      } else {
        dislikedAuthors[interaction.book_author] = (dislikedAuthors[interaction.book_author] || 0) + Math.abs(signal) * weight;
      }
    }
    // Categories
    if (interaction.book_categories && Array.isArray(interaction.book_categories)) {
      for (const cat of interaction.book_categories) {
        if (signal > 0) {
          likedCategories[cat] = (likedCategories[cat] || 0) + signal * weight;
        } else {
          dislikedCategories[cat] = (dislikedCategories[cat] || 0) + Math.abs(signal) * weight;
        }
      }
    }
    // Tags (if present in bookIndexMap)
    if (bookIndexMap && interaction.book_isbn && bookIndexMap[interaction.book_isbn]?.tags) {
      for (const tag of bookIndexMap[interaction.book_isbn].tags || []) {
        if (signal > 0) {
          likedTags[tag] = (likedTags[tag] || 0) + signal * weight;
        } else {
          dislikedTags[tag] = (dislikedTags[tag] || 0) + Math.abs(signal) * weight;
        }
      }
    }
    // Aggregate liked book embeddings
    if (signal > 0 && bookIndexMap && interaction.book_isbn && bookIndexMap[interaction.book_isbn]?.content_embedding) {
      likedEmbeddings.push(bookIndexMap[interaction.book_isbn].content_embedding!);
    }
  }

  // Compute average user embedding (1536-dim)
  let userEmbedding: number[] | null = null;
  if (likedEmbeddings.length > 0) {
    userEmbedding = Array(likedEmbeddings[0].length).fill(0);
    for (const emb of likedEmbeddings) {
      for (let i = 0; i < emb.length; i++) {
        userEmbedding[i] += emb[i];
      }
    }
    for (let i = 0; i < userEmbedding.length; i++) {
      userEmbedding[i] /= likedEmbeddings.length;
    }
  }

  return { likedGenres, dislikedGenres, likedAuthors, dislikedAuthors, likedCategories, dislikedCategories, likedTags, dislikedTags, userEmbedding };
}

/**
 * Calculate a hybrid personalized score for a book based on user preferences and embedding similarity.
 * Scoring:
 *   +2 for genre match
 *   +3 for author match
 *   +1.5 for category match
 *   +1 for tag match
 *   -2 for dismissed genre/author/category/tag
 *   +4 * embedding similarity (cosine, 0-1)
 * Returns a numerical score (higher = better).
 */
export function calculateHybridBookScore(book: BookIndex, prefs: UserPreferences): number {
  let score = 0;
  // Genre match
  if (book.genre && prefs.likedGenres[book.genre]) {
    score += 2;
  }
  if (book.genre && prefs.dislikedGenres[book.genre]) {
    score -= 2;
  }
  // Author match
  if (book.primary_author && prefs.likedAuthors[book.primary_author]) {
    score += 3;
  }
  if (book.primary_author && prefs.dislikedAuthors[book.primary_author]) {
    score -= 2;
  }
  // Category match
  if (book.categories && Array.isArray(book.categories)) {
    for (const cat of book.categories) {
      if (prefs.likedCategories[cat]) score += 1.5;
      if (prefs.dislikedCategories[cat]) score -= 2;
    }
  }
  // Tag match
  if (book.tags && Array.isArray(book.tags)) {
    for (const tag of book.tags) {
      if (prefs.likedTags[tag]) score += 1;
      if (prefs.dislikedTags[tag]) score -= 2;
    }
  }
  // Embedding similarity
  if (prefs.userEmbedding && book.content_embedding && book.content_embedding.length === prefs.userEmbedding.length) {
    const sim = cosineSimilarity(prefs.userEmbedding, book.content_embedding);
    score += 4 * sim; // Weight can be tuned
  }
  return score;
} 