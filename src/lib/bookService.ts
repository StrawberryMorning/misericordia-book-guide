import { Book } from '@/types/book';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { getStoredBooks, saveStoredBooks } from './storage';

// Helper to map DB row to Book
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre || 'Geral',
    totalPages: row.total_pages || 100,
    currentPage: row.current_page || 0,
    status: row.status || 'want_to_read',
    rating: row.rating || 0,
    mediaType: row.media_type || 'book',
    unitType: row.unit_type || 'pages',
    coverUrl: row.cover_url || '',
    notes: row.notes || '',
    favoriteQuote: row.favorite_quote || '',
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to map Book to DB row
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBookToRow(book: Book, userId: string): any {
  return {
    id: book.id,
    user_id: userId,
    title: book.title,
    author: book.author,
    genre: book.genre,
    total_pages: book.totalPages,
    current_page: book.currentPage,
    status: book.status,
    rating: book.rating,
    media_type: book.mediaType || 'book',
    unit_type: book.unitType || 'pages',
    cover_url: book.coverUrl || null,
    notes: book.notes || null,
    favorite_quote: book.favoriteQuote || null,
    started_at: book.startedAt || null,
    finished_at: book.finishedAt || null,
    updated_at: new Date().toISOString(),
  };
}

// 1. Fetch all books (Cloud if logged in, LocalStorage if guest)
export async function fetchBooks(): Promise<Book[]> {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) {
    return getStoredBooks();
  }

  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return getStoredBooks();
    }

    const { data, error } = await client
      .from('books')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error || !data) {
      console.warn('Erro ao buscar do Supabase, usando local:', error);
      return getStoredBooks();
    }

    const books = data.map(mapRowToBook);
    // Cache in local storage for offline instant speed
    saveStoredBooks(books);
    return books;
  } catch (err) {
    console.error('Falha de conexão Supabase:', err);
    return getStoredBooks();
  }
}

// 2. Save / Upsert a single book
export async function syncSaveBook(book: Book): Promise<void> {
  // Always update local storage first (Optimistic UI - 0ms latency)
  const local = getStoredBooks();
  const exists = local.some((b) => b.id === book.id);
  const updated = exists ? local.map((b) => (b.id === book.id ? book : b)) : [book, ...local];
  saveStoredBooks(updated);

  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return;

  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    await client.from('books').upsert(mapBookToRow(book, user.id));
  } catch (err) {
    console.error('Erro ao sincronizar livro na nuvem:', err);
  }
}

// 3. Delete a book
export async function syncDeleteBook(bookId: string): Promise<void> {
  // Local first
  const local = getStoredBooks();
  saveStoredBooks(local.filter((b) => b.id !== bookId));

  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return;

  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    await client.from('books').delete().eq('id', bookId);
  } catch (err) {
    console.error('Erro ao excluir livro na nuvem:', err);
  }
}

// 4. Migrate local guest books to cloud account after login
export async function migrateLocalBooksToCloud(): Promise<number> {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return 0;

  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return 0;

    const localBooks = getStoredBooks();
    if (localBooks.length === 0) return 0;

    const rows = localBooks.map((b) => mapBookToRow(b, user.id));
    const { error } = await client.from('books').upsert(rows);

    if (error) {
      console.error('Erro na migração:', error);
      return 0;
    }

    return localBooks.length;
  } catch (err) {
    console.error('Falha ao migrar livros:', err);
    return 0;
  }
}
