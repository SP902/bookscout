import { NextRequest, NextResponse } from 'next/server';
import { logUserInteraction, getBookByISBN, upsertBookToIndex, getUserProfile } from '../../../../lib/supabase';
import type { Book } from '../../../../lib/types';

interface ViewportEvent {
  bookId: string;
  bookData: Book;
  duration_ms?: number;
  scroll_depth_percent?: number;
  position_in_results?: number;
}

interface ViewportBatch {
  userId: string;
  sessionId: string;
  currentMode: 'Fresh' | 'Smart';
  events: ViewportEvent[];
}

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId, currentMode, events }: ViewportBatch = await req.json();
    
    if (!userId || !sessionId || !currentMode || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or invalid events array.' }, { status: 400 });
    }

    // Validate that user exists and current mode is Smart
    const { data: userProfile, error: profileError } = await getUserProfile(userId);
    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    if (currentMode !== 'Smart') {
      return NextResponse.json({ error: 'Tracking only allowed in Smart Mode.' }, { status: 403 });
    }

    // Process each viewport event
    const interactionPromises = events.map(async (event) => {
      const { bookId, bookData, duration_ms, scroll_depth_percent, position_in_results } = event;
      
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

      // Create viewport interaction
      const interaction = {
        user_id: userId,
        session_id: sessionId,
        interaction_type: 'viewed',
        book_isbn: bookId,
        signal_strength: 0.05, // Very low signal for passive tracking
        position_in_results: typeof position_in_results === 'number' ? position_in_results : null,
        view_duration_ms: typeof duration_ms === 'number' ? duration_ms : null,
        scroll_depth_percent: typeof scroll_depth_percent === 'number' ? scroll_depth_percent : null,
        discovery_context: {
          tracking_type: 'viewport',
          batch_size: events.length,
          timestamp: new Date().toISOString()
        },
      };

      return logUserInteraction(interaction);
    });

    // Execute all interactions in parallel
    const results = await Promise.all(interactionPromises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Some viewport interactions failed:', errors);
      return NextResponse.json({ 
        error: 'Some interactions failed to log.',
        failedCount: errors.length,
        totalCount: events.length
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      processedCount: events.length,
      message: `Successfully logged ${events.length} viewport events`
    });

  } catch (err) {
    console.error('Viewport batch tracking error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
} 