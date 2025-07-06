// TypeScript types for Supabase tables (auto-generated from schema)

export type UserProfile = {
  id: string;
  email: string;
  smart_mode_enabled: boolean | null;
  smart_mode_consent_token: string | null;
  smart_mode_enabled_at: string | null;
  preferred_discovery_mode: 'fresh' | 'smart' | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  data_retention_days: number | null;
  deletion_requested_at: string | null;
  deletion_completed_at: string | null;
};

export type BookIndex = {
  isbn_13: string;
  isbn_10: string | null;
  google_books_id: string | null;
  asin: string | null;
  title: string;
  subtitle: string | null;
  authors: string[] | null;
  primary_author: string | null;
  genre: string | null;
  categories: string[] | null;
  language: string | null;
  description: string | null;
  page_count: number | null;
  published_date: string | null;
  publisher: string | null;
  average_rating: number | null;
  ratings_count: number | null;
  popularity_score: number | null;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  preview_link: string | null;
  amazon_affiliate_url: string | null;
  flipkart_affiliate_url: string | null;
  audible_affiliate_url: string | null;
  affiliate_disclosure_required: boolean | null;
  content_embedding: number[] | null;
  genre_embedding: number[] | null;
  content_hash: string | null;
  embedding_model_version: string | null;
  embedding_computed_at: string | null;
  quality_score: number | null;
  search_text: unknown | null;
  tags: string[] | null;
  data_source: string | null;
  last_updated_at: string | null;
  is_active: boolean | null;
  is_available: boolean | null;
  created_at: string;
  updated_at: string;
};

export type SmartDiscoveryProfile = {
  user_id: string;
  preferred_genres: Record<string, unknown>;
  preferred_authors: Record<string, unknown>;
  preferred_themes: Record<string, unknown>;
  preferred_categories: Record<string, unknown>;
  reading_level: 'beginner' | 'intermediate' | 'advanced' | 'mixed' | null;
  discovery_style: 'conservative' | 'balanced' | 'adventurous' | null;
  typical_session_length: number | null;
  average_rating_given: number | null;
  user_embedding: number[] | null;
  genre_exploration_rate: number | null;
  diversity_preference: number | null;
  novelty_preference: number | null;
  total_discoveries: number | null;
  successful_discoveries: number | null;
  total_interactions: number | null;
  profile_confidence: number | null;
  model_version: string | null;
  last_training_date: string | null;
  next_training_due: string | null;
  created_at: string;
  last_updated: string;
  last_interaction_at: string | null;
  data_expires_at: string;
};

export type UserInteraction = {
  id: string;
  user_id: string;
  session_id: string | null;
  recommendation_id: string | null;
  interaction_type: string;
  book_isbn: string;
  book_title: string | null;
  book_author: string | null;
  book_genre: string | null;
  book_categories: string[] | null;
  signal_strength: number | null;
  position_in_results: number | null;
  view_duration_ms: number | null;
  scroll_depth_percent: number | null;
  click_coordinates: Record<string, unknown> | null;
  user_rating: number | null;
  user_feedback: string | null;
  discovery_context: Record<string, unknown> | null;
  search_query: string | null;
  recommendation_algorithm: string | null;
  interaction_embedding: number[] | null;
  relevance_score: number | null;
  device_type: string | null;
  user_agent_hash: string | null;
  affiliate_platform: string | null;
  affiliate_click_tracked: boolean | null;
  created_at: string;
  processed_for_ml: boolean | null;
  processed_at: string | null;
  deleted_at: string | null;
};

export type SmartDiscoverySession = {
  id: string;
  user_id: string;
  session_id: string;
  frontend_session_id: string | null;
  user_prompt: string;
  processed_prompt: string | null;
  search_queries: Record<string, unknown> | null;
  search_strategy: string | null;
  books_discovered: Record<string, unknown> | null;
  total_books_found: number | null;
  recommendation_algorithm: string | null;
  personalization_level: number | null;
  discovery_reasoning: string | null;
  personalized_insights: string | null;
  reading_journey: string | null;
  why_perfect_for_you: string | null;
  discovery_growth: string | null;
  ml_reasoning: string | null;
  response_time_ms: number | null;
  cache_hit: boolean | null;
  ml_processing_time_ms: number | null;
  user_embedding_used: number[] | null;
  model_version: string | null;
  confidence_score: number | null;
  diversity_score: number | null;
  novelty_score: number | null;
  relevance_score: number | null;
  created_at: string;
  completed_at: string | null;
  deleted_at: string | null;
};

export type PrivacyConsent = {
  id: string;
  user_id: string;
  consent_type: string;
  consent_given: boolean;
  consent_version: string | null;
  consent_token: string | null;
  consent_method: string | null;
  legal_basis: string | null;
  ip_address: string | null;
  user_agent_hash: string | null;
  page_url: string | null;
  referrer_url: string | null;
  user_country: string | null;
  gdpr_applies: boolean | null;
  ccpa_applies: boolean | null;
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FreshModeMetric = {
  id: string;
  metric_date: string;
  metric_hour: number | null;
  total_requests: number | null;
  successful_requests: number | null;
  failed_requests: number | null;
  avg_response_time_ms: number | null;
  max_response_time_ms: number | null;
  min_response_time_ms: number | null;
  total_books_returned: number | null;
  cache_hit_rate: number | null;
  error_rate: number | null;
  region_code: string | null;
  unique_genres_served: number | null;
  unique_authors_served: number | null;
  avg_books_per_request: number | null;
  created_at: string;
  updated_at: string;
};

export type SmartPromptEmbedding = {
  id: string;
  user_id: string;
  prompt_hash: string;
  embedding_vector: number[];
  created_at: string;
};

// Simplified Book interface for API responses (basic metadata only)
export interface Book {
  isbn_13: string;
  isbn_10: string | null;
  google_books_id: string | null;
  title: string;
  subtitle: string | null;
  authors: string[] | null;
  primary_author: string | null;
  genre: string | null;
  categories: string[] | null;
  description: string | null;
  page_count: number | null;
  published_date: string | null;
  publisher: string | null;
  average_rating: number | null;
  thumbnail_url: string | null;
  cover_image_url: string | null;
}

// Utility function to convert BookIndex to Book (extract only Book fields)
export function toBook(bookIndex: BookIndex): Book {
  const {
    isbn_13, isbn_10, google_books_id, title, subtitle, authors,
    primary_author, genre, categories, description, page_count,
    published_date, publisher, average_rating, thumbnail_url, cover_image_url
  } = bookIndex;
  
  return {
    isbn_13, isbn_10, google_books_id, title, subtitle, authors,
    primary_author, genre, categories, description, page_count,
    published_date, publisher, average_rating, thumbnail_url, cover_image_url
  };
} 