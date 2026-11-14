export interface GoogleBookSearchResult {
  title: string;
  author: string;
  genre: string;
  totalPages: number;
  coverUrl?: string;
  description?: string;
}

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
}

interface GoogleApiItem {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    categories?: string[];
    pageCount?: number;
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

// 1. Open Library API (100% Free, No 429 Quotas, Millions of international & Brazilian books)
async function fetchFromOpenLibrary(query: string, timeoutMs = 4000): Promise<GoogleBookSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.docs || !Array.isArray(data.docs) || data.docs.length === 0) return [];

    return data.docs.map((doc: OpenLibraryDoc) => {
      const cover = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : '';

      const author =
        doc.author_name && doc.author_name.length > 0
          ? doc.author_name.slice(0, 2).join(', ')
          : 'Autor Desconhecido';

      const genre =
        doc.subject && doc.subject.length > 0
          ? doc.subject[0].split(',')[0].slice(0, 20)
          : 'Literatura';

      const pages =
        typeof doc.number_of_pages_median === 'number' && doc.number_of_pages_median > 0
          ? doc.number_of_pages_median
          : 250;

      return {
        title: doc.title || 'Sem título',
        author,
        genre,
        totalPages: pages,
        coverUrl: cover,
        description: '',
      };
    });
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// 2. Google Books API (com timeout)
async function fetchFromGoogleBooks(query: string, timeoutMs = 3500): Promise<GoogleBookSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=6`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return []; // Retorna vazio se der 429 ou erro
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items.map((item: GoogleApiItem) => {
      const info = item.volumeInfo || {};
      const cover =
        info.imageLinks?.thumbnail ||
        info.imageLinks?.smallThumbnail ||
        '';

      const secureCover = cover ? cover.replace(/^http:\/\//i, 'https://') : '';

      return {
        title: info.title || 'Sem título',
        author: Array.isArray(info.authors) ? info.authors.join(', ') : 'Autor desconhecido',
        genre: Array.isArray(info.categories) && info.categories.length > 0 ? info.categories[0] : 'Geral',
        totalPages: typeof info.pageCount === 'number' && info.pageCount > 0 ? info.pageCount : 200,
        coverUrl: secureCover,
        description: info.description || '',
      };
    });
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// Busca unificada com fallback automático
export async function searchGoogleBooks(query: string): Promise<GoogleBookSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  // 1. Tenta Open Library primeiro (sem cota de 429)
  const openLibraryResults = await fetchFromOpenLibrary(query, 3500);
  if (openLibraryResults.length > 0) {
    return openLibraryResults;
  }

  // 2. Se falhar ou vier vazio, tenta Google Books
  const googleResults = await fetchFromGoogleBooks(query, 3000);
  return googleResults;
}
