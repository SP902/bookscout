import { createClient } from '@supabase/supabase-js';
import type {
  UserProfile,
  BookIndex,
  SmartDiscoveryProfile,
  UserInteraction,
  SmartDiscoverySession,
  PrivacyConsent,
  FreshModeMetric,
  SmartPromptEmbedding
} from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// USER PROFILE HELPERS

/**
 * Fetch a user profile by id (UUID)
 */
export async function getUserProfile(id: string): Promise<{ data: UserProfile | null, error: any }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

/**
 * Upsert (insert or update) a user profile
 */
export async function upsertUserProfile(profile: Partial<UserProfile>): Promise<{ data: UserProfile | null, error: any }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  return { data, error };
}

/**
 * Update a user profile by id
 */
export async function updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<{ data: UserProfile | null, error: any }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', id)
    .single();
  return { data, error };
}

/**
 * Delete a user profile by id
 */
export async function deleteUserProfile(userId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId);
  return { error };
}

// BOOK INDEX HELPERS

/**
 * Fetch a book by ISBN-13
 */
export async function getBookByISBN(isbn_13: string): Promise<{ data: BookIndex | null, error: any }> {
  const { data, error } = await supabase
    .from('book_index')
    .select('*')
    .eq('isbn_13', isbn_13)
    .single();
  return { data, error };
}

/**
 * Search books by title (case-insensitive, partial match)
 */
export async function searchBooksByTitle(title: string): Promise<{ data: BookIndex[] | null, error: any }> {
  const { data, error } = await supabase
    .from('book_index')
    .select('*')
    .ilike('title', `%${title}%`);
  return { data, error };
}

/**
 * Get a book by ISBN-13, or fetch from external API and cache if not present or stale
 * (External API fetch logic should be implemented separately)
 * @param isbn_13 - ISBN-13 of the book
 * @param maxAgeHours - Maximum age in hours before cache is considered stale
 */
export async function getOrFetchAndCacheBook(isbn_13: string, maxAgeHours: number): Promise<{ data: BookIndex | null, error: any, fetchedFromApi?: boolean }> {
  // 1. Try to get the book from BookIndex and check staleness
  const { data, error } = await supabase
    .from('book_index')
    .select('*')
    .eq('isbn_13', isbn_13)
    .single();
  if (error && error.code !== 'PGRST116') { // Not found error
    return { data: null, error };
  }
  if (data) {
    const updatedAt = new Date(data.updated_at);
    const now = new Date();
    const ageHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
    if (ageHours <= maxAgeHours) {
      return { data, error: null };
    }
  }
  // 2. If not found or stale, fetch from external API (to be implemented) and upsert
  // Placeholder: return null and set fetchedFromApi flag
  return { data: null, error: null, fetchedFromApi: true };
}

/**
 * Delete books from BookIndex that have not been updated in more than X hours
 * @param maxAgeHours - Maximum age in hours before deletion
 */
export async function deleteStaleBooks(maxAgeHours: number): Promise<{ error: any, deletedCount?: number }> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('book_index')
    .delete()
    .lt('updated_at', cutoff)
    .select('isbn_13');
  return { error, deletedCount: data ? data.length : 0 };
}

// USER INTERACTION HELPERS

/**
 * Log a user interaction
 */
export async function logUserInteraction(interaction: Partial<UserInteraction>): Promise<{ data: UserInteraction | null, error: any }> {
  const { data, error } = await supabase
    .from('user_interactions')
    .insert(interaction)
    .select()
    .single();
  return { data, error };
}

/**
 * Delete all user interactions for a user
 */
export async function deleteUserInteractions(userId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('user_interactions')
    .delete()
    .eq('user_id', userId);
  return { error };
}

// SMART DISCOVERY SESSION HELPERS

/**
 * Create a new smart discovery session
 */
export async function createSmartDiscoverySession(session: Partial<SmartDiscoverySession>): Promise<{ data: SmartDiscoverySession | null, error: any }> {
  const { data, error } = await supabase
    .from('smart_discovery_sessions')
    .insert(session)
    .select()
    .single();
  return { data, error };
}

/**
 * Delete all smart discovery sessions for a user
 */
export async function deleteUserSessions(userId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('smart_discovery_sessions')
    .delete()
    .eq('user_id', userId);
  return { error };
}

// SMART DISCOVERY PROFILE HELPERS

/**
 * Get a user's smart discovery profile
 */
export async function getSmartDiscoveryProfile(userId: string): Promise<{ data: SmartDiscoveryProfile | null, error: any }> {
  const { data, error } = await supabase
    .from('smart_discovery_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
}

/**
 * Delete a user's smart discovery profile
 */
export async function deleteUserDiscoveryProfile(userId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('smart_discovery_profiles')
    .delete()
    .eq('user_id', userId);
  return { error };
}

// PRIVACY CONSENT HELPERS

/**
 * Delete all privacy consents for a user
 */
export async function deleteUserConsents(userId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('privacy_consents')
    .delete()
    .eq('user_id', userId);
  return { error };
}

// FRESH MODE METRIC HELPERS

/**
 * Insert a fresh mode metric record
 */
export async function insertFreshModeMetric(metric: Partial<FreshModeMetric>): Promise<{ data: FreshModeMetric | null, error: any }> {
  const { data, error } = await supabase
    .from('fresh_mode_metrics')
    .insert(metric)
    .select()
    .single();
  return { data, error };
}

/**
 * Get fresh mode metrics (optionally by date)
 */
export async function getFreshModeMetrics(metric_date?: string): Promise<{ data: FreshModeMetric[] | null, error: any }> {
  let query = supabase
    .from('fresh_mode_metrics')
    .select('*');
  if (metric_date) {
    query = query.eq('metric_date', metric_date);
  }
  const { data, error } = await query;
  return { data, error };
}

// Store hashed prompt and embedding for Smart mode personalization
// (Assume a table smart_prompt_embeddings(user_id, prompt_hash, embedding_vector))
export async function storePromptEmbedding(userId: string, promptHash: string, embedding: number[]): Promise<void> {
  // This is a placeholder. You should create a table smart_prompt_embeddings with columns:
  // user_id (UUID), prompt_hash (TEXT), embedding_vector (FLOAT8[])
  await supabase.from('smart_prompt_embeddings').insert({
    user_id: userId,
    prompt_hash: promptHash,
    embedding_vector: embedding,
  });
}

// Fetch all smart prompt embeddings for a user
export async function getSmartPromptEmbeddings(userId: string): Promise<SmartPromptEmbedding[]> {
  const { data, error } = await supabase
    .from('smart_prompt_embeddings')
    .select('*')
    .eq('user_id', userId);
  if (error) return [];
  return data || [];
}

/**
 * Upsert a book into book_index by ISBN-13
 */
export async function upsertBookToIndex(book: Partial<BookIndex>): Promise<{ data: BookIndex | null, error: any }> {
  const { data, error } = await supabase
    .from('book_index')
    .upsert(book, { onConflict: 'isbn_13' })
    .select()
    .single();
  return { data, error };
}

/**
 * Delete all smart prompt embeddings for a user
 */
export async function deleteSmartPromptEmbeddings(userId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('smart_prompt_embeddings')
    .delete()
    .eq('user_id', userId);
  return { error };
}

/**
 * Delete all smart discovery sessions for a user
 */
export async function deleteSmartDiscoverySessions(userId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('smart_discovery_sessions')
    .delete()
    .eq('user_id', userId);
  return { error };
}

/**
 * Delete smart discovery profile for a user
 */
export async function deleteSmartDiscoveryProfile(userId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('smart_discovery_profiles')
    .delete()
    .eq('user_id', userId);
  return { error };
}

/**
 * Delete privacy consents for a user
 */
export async function deletePrivacyConsents(userId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('privacy_consents')
    .delete()
    .eq('user_id', userId);
  return { error };
} 