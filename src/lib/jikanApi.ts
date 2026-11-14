export interface JikanMangaSearchResult {
  malId: number | string;
  title: string;
  author: string;
  genre: string;
  totalChapters: number;
  totalVolumes: number;
  coverUrl: string;
  synopsis?: string;
  score?: number;
  status: string;
  source: 'MyAnimeList' | 'AniList';
}

interface JikanRawItem {
  mal_id: number;
  title: string;
  title_english?: string | null;
  images?: {
    jpg?: { image_url?: string; large_image_url?: string };
    webp?: { image_url?: string; large_image_url?: string };
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

interface AniListMediaItem {
  id: number;
  title?: { romaji?: string; english?: string };
  chapters?: number | null;
  volumes?: number | null;
  coverImage?: { large?: string; medium?: string };
  description?: string;
  genres?: string[];
  averageScore?: number;
  status?: string;
  staff?: {
    nodes?: Array<{ name?: { full?: string } }>;
  };
}

// 1. Fetch from Jikan (MyAnimeList) with timeout
async function fetchFromJikan(query: string, timeoutMs = 3500): Promise<JikanMangaSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=6`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data.map((item: JikanRawItem) => {
      const authorList =
        item.authors && item.authors.length > 0
          ? item.authors.map((a) => a.name.split(', ').reverse().join(' ')).join(', ')
          : 'Autor Desconhecido';

      const genreList =
        [
          ...(item.demographics?.map((d) => d.name) || []),
          ...(item.genres?.map((g) => g.name) || []),
        ]
          .slice(0, 2)
          .join(' / ') || 'Mangá';

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
        source: 'MyAnimeList',
      };
    });
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// 2. Fetch from AniList (Ultra-fast GraphQL fallback)
async function fetchFromAniList(query: string, timeoutMs = 3500): Promise<JikanMangaSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const gqlQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 6) {
        media(search: $search, type: MANGA) {
          id
          title {
            romaji
            english
          }
          chapters
          volumes
          coverImage {
            large
            medium
          }
          description(asHtml: false)
          genres
          averageScore
          status
          staff(perPage: 1) {
            nodes {
              name {
                full
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: gqlQuery,
        variables: { search: query },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return [];
    const json = await res.json();
    const list = json?.data?.Page?.media;
    if (!Array.isArray(list)) return [];

    return list.map((item: AniListMediaItem) => {
      const author = item.staff?.nodes?.[0]?.name?.full || 'Mangaká';
      const cleanDesc = (item.description || '').replace(/<[^>]*>?/gm, '');

      return {
        malId: `al-${item.id}`,
        title: item.title?.english || item.title?.romaji || 'Sem título',
        author,
        genre: item.genres?.slice(0, 2).join(' / ') || 'Mangá',
        totalChapters: item.chapters && item.chapters > 0 ? item.chapters : 50,
        totalVolumes: item.volumes && item.volumes > 0 ? item.volumes : 1,
        coverUrl: item.coverImage?.large || item.coverImage?.medium || '',
        synopsis: cleanDesc,
        score: item.averageScore ? item.averageScore / 10 : undefined,
        status: item.status || 'FINISHED',
        source: 'AniList',
      };
    });
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// Main Search function: runs with fast fallback
export async function searchJikanManga(query: string): Promise<JikanMangaSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  // Try Jikan first (3.5s timeout)
  const jikanResults = await fetchFromJikan(query, 3500);
  if (jikanResults.length > 0) {
    return jikanResults;
  }

  // If Jikan was slow, empty, or failed, fallback to AniList
  const anilistResults = await fetchFromAniList(query, 3500);
  return anilistResults;
}
