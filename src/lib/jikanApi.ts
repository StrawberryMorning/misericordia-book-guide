export interface JikanMangaSearchResult {
  malId: number;
  title: string;
  author: string;
  genre: string;
  totalChapters: number;
  totalVolumes: number;
  coverUrl: string;
  synopsis?: string;
  score?: number;
  status: string;
}

interface JikanRawItem {
  mal_id: number;
  title: string;
  title_english?: string | null;
  images?: {
    jpg?: {
      image_url?: string;
      large_image_url?: string;
    };
    webp?: {
      image_url?: string;
      large_image_url?: string;
    };
  };
  chapters?: number | null;
  volumes?: number | null;
  status?: string;
  synopsis?: string | null;
  score?: number | null;
  authors?: Array<{ name: string }>;
  genres?: Array<{ name: string }>;
  demographics?: Array<{ name: string }>;
}

export async function searchJikanManga(query: string): Promise<JikanMangaSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=6`
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data.map((item: JikanRawItem) => {
      const authorList =
        item.authors && item.authors.length > 0
          ? item.authors.map((a) => a.name.split(', ').reverse().join(' ')).join(', ')
          : 'Autor Desconhecido';

      const genreList = [
        ...(item.demographics?.map((d) => d.name) || []),
        ...(item.genres?.map((g) => g.name) || []),
      ].slice(0, 2).join(' / ') || 'Mangá';

      const cover =
        item.images?.webp?.large_image_url ||
        item.images?.jpg?.large_image_url ||
        item.images?.jpg?.image_url ||
        '';

      return {
        malId: item.mal_id,
        title: item.title_english || item.title,
        author: authorList,
        genre: genreList,
        totalChapters: item.chapters && item.chapters > 0 ? item.chapters : 50,
        totalVolumes: item.volumes && item.volumes > 0 ? item.volumes : 1,
        coverUrl: cover,
        synopsis: item.synopsis || '',
        score: item.score || undefined,
        status: item.status || 'Publishing',
      };
    });
  } catch (err) {
    console.error('Falha ao buscar mangá na Jikan API:', err);
    return [];
  }
}
