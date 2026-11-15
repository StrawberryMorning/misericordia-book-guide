export interface GoogleBookSearchResult {
  title: string;
  author: string;
  genre: string;
  totalPages: number;
  coverUrl?: string;
  description?: string;
  source?: 'Google Books' | 'Open Library';
}

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  isbn?: string[];
  subject?: string[];
  first_sentence?: { value?: string };
}

interface GoogleApiItem {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    categories?: string[];
    pageCount?: number;
    description?: string;
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
  };
}

// 1. Fetch from Open Library API (100% Free, No 429 Quotas)
async function fetchFromOpenLibrary(query: string, timeoutMs = 4000): Promise<GoogleBookSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.docs || !Array.isArray(data.docs) || data.docs.length === 0) return [];

    return data.docs.map((doc: OpenLibraryDoc) => {
      // Prefer Large cover (-L.jpg), fallback to Medium (-M.jpg)
      const cover = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : doc.isbn && doc.isbn.length > 0
        ? `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`
        : '';

      const author =
        doc.author_name && doc.author_name.length > 0
          ? doc.author_name.slice(0, 2).join(', ')
          : 'Autor Desconhecido';

      const genre =
        doc.subject && doc.subject.length > 0
          ? doc.subject[0].split(',')[0].slice(0, 25)
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
        description: doc.first_sentence?.value || '',
        source: 'Open Library',
      };
    });
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// 2. Fetch from Google Books API
async function fetchFromGoogleBooks(query: string, timeoutMs = 3500): Promise<GoogleBookSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items.map((item: GoogleApiItem) => {
      const info = item.volumeInfo || {};

      // Prefer highest resolution available
      let cover =
        info.imageLinks?.extraLarge ||
        info.imageLinks?.large ||
        info.imageLinks?.medium ||
        info.imageLinks?.thumbnail ||
        info.imageLinks?.smallThumbnail ||
        '';

      if (cover) {
        // Upgrade to https and request high-res zoom if available
        cover = cover.replace(/^http:\/\//i, 'https://');
        if (cover.includes('&edge=curl')) {
          cover = cover.replace('&edge=curl', '');
        }
      }

      // Check if ISBN exists for cover fallback
      const isbnObj = info.industryIdentifiers?.find(
        (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      );
      if (!cover && isbnObj?.identifier) {
        cover = `https://covers.openlibrary.org/b/isbn/${isbnObj.identifier}-L.jpg`;
      }

      return {
        title: info.title || 'Sem título',
        author: Array.isArray(info.authors) ? info.authors.join(', ') : 'Autor desconhecido',
        genre:
          Array.isArray(info.categories) && info.categories.length > 0
            ? info.categories[0]
            : 'Geral',
        totalPages:
          typeof info.pageCount === 'number' && info.pageCount > 0 ? info.pageCount : 200,
        coverUrl: cover,
        description: info.description || '',
        source: 'Google Books',
      };
    });
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// 3. Cascata Inteligente de Busca para Livros
export async function searchGoogleBooks(query: string): Promise<GoogleBookSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  // Passo 1: Tenta Google Books (título e sinopse em PT-BR)
  const googleResults = await fetchFromGoogleBooks(query, 3500);

  // Se Google Books trouxe resultados com capas
  if (googleResults.length > 0) {
    // Se algum dos primeiros resultados estiver sem capa, tenta enriquecer com Open Library
    const enriched = await Promise.all(
      googleResults.slice(0, 4).map(async (book) => {
        if (!book.coverUrl) {
          try {
            const ol = await fetchFromOpenLibrary(`${book.title} ${book.author}`, 1800);
            if (ol[0]?.coverUrl) {
              return { ...book, coverUrl: ol[0].coverUrl };
            }
          } catch {
            // keep book as is
          }
        }
        return book;
      })
    );

    return [...enriched, ...googleResults.slice(4)];
  }

  // Passo 2: Se o Google Books falhou (429, timeout ou vazio), ativa Open Library
  const openLibraryResults = await fetchFromOpenLibrary(query, 4000);
  return openLibraryResults;
}
