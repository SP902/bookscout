import { NextRequest, NextResponse } from 'next/server';
import { logUserInteraction, getBookByISBN, upsertBookToIndex, getUserProfile } from '../../../../lib/supabase';
import type { Book } from '../../../../lib/types';

const INTERACTION_MAP = {
  add_to_list: { type: 'saved', signal: 1.0 },
  show_more_like: { type: 'liked', signal: 0.8 },
  hide_similar: { type: 'dismissed', signal: -0.5 },
  clicked: { type: 'clicked', signal: 0.1 },
  viewed: { type: 'viewed', signal: 0.05 },
};

export async function POST(req: NextRequest) {
  try {
    type InteractionType = 'add_to_list' | 'show_more_like' | 'hide_similar' | 'clicked' | 'viewed';
    interface ReqBody {
      userId: string;
      bookId: string;
      interactionType: InteractionType;
      bookData: Book;
      position_in_results?: number;
      session_id?: string;
      discovery_context?: any;
      currentMode: 'Fresh' | 'Smart';
    }
    const { userId, bookId, interactionType, bookData, position_in_results, session_id, discovery_context, currentMode } = await req.json() as ReqBody;
    if (!userId || !bookId || !interactionType || !bookData || !currentMode) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Validate that user exists and current mode is Smart
    const { data: userProfile, error: profileError } = await getUserProfile(userId);
    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    if (currentMode !== 'Smart') {
      return NextResponse.json({ error: 'Tracking only allowed in Smart Mode.' }, { status: 403 });
    }
    const map = INTERACTION_MAP[interactionType];
    if (!map) {
      return NextResponse.json({ error: 'Invalid interaction type.' }, { status: 400 });
    }
    // Normalize: ensure book exists in book_index
    const { data: existingBook } = await getBookByISBN(bookId);
    if (!existingBook) {
      // Insert book into book_index (partial, only if not exists)
      await upsertBookToIndex({
        isbn_13: bookData.isbn_13,
        isbn_10: bookData.isbn_10,
        google_books_id: bookData.google_books_id,
        title: bookData.title,
        subtitle: bookData.subtitle,
        authors: bookData.authors,
        primary_author: bookData.primary_author,
        genre: bookData.genre,
        categories: bookData.categories,
        description: bookData.description,
        page_count: bookData.page_count,
        published_date: bookData.published_date,
        publisher: bookData.publisher,
        average_rating: bookData.average_rating,
        thumbnail_url: bookData.thumbnail_url,
        cover_image_url: bookData.cover_image_url,
      });
    }
    // Only store book_isbn in user_interactions
    const { type, signal } = map;
    const interaction = {
      user_id: userId,
      session_id: session_id || null,
      interaction_type: type,
      book_isbn: bookId,
      signal_strength: signal,
      position_in_results: typeof position_in_results === 'number' ? position_in_results : null,
      discovery_context: discovery_context || null,
    };
    const { data, error } = await logUserInteraction(interaction);
    if (error) {
      return NextResponse.json({ error: 'Failed to log interaction.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, interaction: data });
  } catch (err) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
} 