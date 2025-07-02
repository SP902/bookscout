import { Book } from '../types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Get OpenAI embedding for a string (text-embedding-3-small)
export async function getEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) throw new Error('Missing OpenAI API key');
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });
  if (!res.ok) throw new Error('OpenAI embedding error');
  const data = await res.json();
  return data.data[0].embedding;
}

// Cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

// Rank books by semantic similarity to prompt embedding
export function rankBooksByEmbedding(promptEmbedding: number[], books: (Book & { embedding: number[] })[]): Book[] {
  return books
    .map(book => ({
      ...book,
      _similarity: cosineSimilarity(promptEmbedding, book.embedding),
    }))
    .sort((a, b) => b._similarity - a._similarity)
    .map(({ _similarity, ...book }) => book);
}

// Extract themes from prompt embedding using OpenAI (cheap embedding model)
export async function extractThemesFromEmbedding(prompt: string): Promise<string[]> {
  // Use OpenAI embedding model to get a vector, then ask OpenAI to summarize themes (cheap, privacy-friendly)
  // For simplicity, just use a simple keyword extraction as a placeholder
  // (You can later replace with a call to OpenAI if you want more advanced theme extraction)
  return Array.from(
    new Set(
      prompt
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
    )
  ).slice(0, 5);
}

// Simple hash function for prompt (Node.js crypto)
export function hashPrompt(prompt: string): string {
  // Use a simple SHA-256 hash for privacy
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(prompt).digest('hex');
} 