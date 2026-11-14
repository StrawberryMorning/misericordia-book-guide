export interface GoogleBookSearchResult {
  title: string;
  author: string;
  genre: string;
  totalPages: number;
  coverUrl?: string;
  description?: string;
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

export async function searchGoogleBooks(query: string): Promise<GoogleBookSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=6&langRestrict=pt`
    );
    if (!res.ok) return [];

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
        totalPages: typeof info.pageCount === 'number' && info.pageCount > 0 ? info.pageCount : 100,
        coverUrl: secureCover,
        description: info.description || '',
      };
    });
  } catch (err) {
    console.error('Falha ao buscar livro na Google Books API:', err);
    return [];
  }
}
