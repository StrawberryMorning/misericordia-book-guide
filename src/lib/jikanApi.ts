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
  source: 'MyAnimeList' | 'AniList' | 'MangaDex';
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
  coverImage?: { large?: string; medium?: string; extraLarge?: string };
  description?: string;
  genres?: string[];
  averageScore?: number;
  status?: string;
  staff?: {
    nodes?: Array<{ name?: { full?: string } }>;
  };
}

interface MangaDexItem {
  id: string;
  attributes?: {
    title?: Record<string, string>;
    altTitles?: Array<Record<string, string>>;
    description?: Record<string, string>;
    lastVolume?: string;
    lastChapter?: string;
    status?: string;
    tags?: Array<{ attributes?: { name?: { en?: string } } }>;
  };
  relationships?: Array<{
    type: string;
    attributes?: {
      fileName?: string;
      name?: string;
    };
  }>;
}

/**
 * Tenta resolver dinamicamente o número real do último capítulo lançado
 * consultando a base viva do MangaDex para obras em andamento (One Piece, Kingdom, etc.)
 */
export async function resolveOngoingMangaLatestChapter(
  title: string,
  mangaDexId?: string,
  timeoutMs = 2800
): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let targetId = mangaDexId;

    if (!targetId) {
      // Limpa título de anotações extras como parênteses
      const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();
      const searchRes = await fetch(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(cleanTitle)}&order[followedCount]=desc&limit=8`,
        { signal: controller.signal }
      );
      if (!searchRes.ok) {
        clearTimeout(timer);
        return 0;
      }
      const searchJson = await searchRes.json();
      const list = searchJson.data;
      if (!Array.isArray(list) || list.length === 0) {
        clearTimeout(timer);
        return 0;
      }

      const lowerTarget = cleanTitle.toLowerCase();
      // 1. Procura correspondência exata de título
      let matchedItem = list.find((item: MangaDexItem) => {
        const titles = Object.values(item.attributes?.title || {});
        if (titles.some((t) => t.toLowerCase() === lowerTarget)) return true;
        const altTitles = (item.attributes?.altTitles || []).flatMap((alt) => Object.values(alt));
        return altTitles.some((t) => t.toLowerCase() === lowerTarget);
      });

      // 2. Se não achou exato, seleciona o mais relevante / seguido
      if (!matchedItem) {
        matchedItem =
          list.find((item: MangaDexItem) => {
            const mainTitle = (Object.values(item.attributes?.title || {})[0] || '').toLowerCase();
            return mainTitle.includes(lowerTarget) || lowerTarget.includes(mainTitle);
          }) || list[0];
      }

      targetId = matchedItem.id;
    }

    if (!targetId) {
      clearTimeout(timer);
      return 0;
    }

    // Consulta os capítulos mais recentes no feed
    const feedRes = await fetch(
      `https://api.mangadex.org/manga/${targetId}/feed?limit=15&order[chapter]=desc`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!feedRes.ok) return 0;

    const feedJson = await feedRes.json();
    if (!feedJson.data || !Array.isArray(feedJson.data)) return 0;

    let maxCh = 0;
    for (const item of feedJson.data) {
      const chStr = item.attributes?.chapter;
      if (chStr) {
        const val = parseFloat(chStr);
        if (!isNaN(val) && val > maxCh && val < 10000) {
          maxCh = val;
        }
      }
    }

    return Math.floor(maxCh);
  } catch {
    clearTimeout(timer);
    return 0;
  }
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

      const chapters = item.chapters && item.chapters > 0 ? item.chapters : 0;
      const volumes = item.volumes && item.volumes > 0 ? item.volumes : 1;

      return {
        malId: item.mal_id,
        title: item.title_english || item.title,
        author: authorList,
        genre: genreList,
        totalChapters: chapters,
        totalVolumes: volumes,
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
async function fetchFromAniList(query: string, timeoutMs = 3000): Promise<JikanMangaSearchResult[]> {
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
            extraLarge
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
      const chapters = item.chapters && item.chapters > 0 ? item.chapters : 0;
      const volumes = item.volumes && item.volumes > 0 ? item.volumes : 1;

      return {
        malId: `al-${item.id}`,
        title: item.title?.english || item.title?.romaji || 'Sem título',
        author,
        genre: item.genres?.slice(0, 2).join(' / ') || 'Mangá',
        totalChapters: chapters,
        totalVolumes: volumes,
        coverUrl: item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium || '',
        synopsis: cleanDesc,
        score: item.averageScore ? item.averageScore / 10 : undefined,
        status: item.status || 'RELEASING',
        source: 'AniList',
      };
    });
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// 3. Fetch from MangaDex (HD Covers, PT-BR titles & synopses)
async function fetchFromMangaDex(query: string, timeoutMs = 3500): Promise<JikanMangaSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&order[followedCount]=desc&limit=6&includes[]=cover_art&includes[]=author`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return [];
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) return [];

    return json.data.map((item: MangaDexItem) => {
      const attrs = item.attributes || {};

      // Prefer English or Japanese Romaji title
      const titleObj = attrs.title || {};
      const title =
        titleObj.en ||
        titleObj['ja-ro'] ||
        (attrs.altTitles && attrs.altTitles.find((t) => t.en)?.en) ||
        Object.values(titleObj)[0] ||
        'Sem título';

      // Find Cover Art fileName from relationships
      const coverRel = item.relationships?.find((r) => r.type === 'cover_art');
      const coverFileName = coverRel?.attributes?.fileName;
      const coverUrl = coverFileName
        ? `https://uploads.mangadex.org/covers/${item.id}/${coverFileName}.512.jpg`
        : '';

      // Find Author name
      const authorRel = item.relationships?.find((r) => r.type === 'author');
      const author = authorRel?.attributes?.name || 'Mangaká';

      // Prioritize Portuguese description, then English
      const descObj = attrs.description || {};
      const synopsis = descObj['pt-br'] || descObj.en || Object.values(descObj)[0] || '';

      // Genres
      const genres =
        attrs.tags
          ?.map((t) => t.attributes?.name?.en)
          .filter(Boolean)
          .slice(0, 2)
          .join(' / ') || 'Mangá';

      const chaptersNum = attrs.lastChapter ? Math.round(Number(attrs.lastChapter)) : 0;
      const volumesNum = attrs.lastVolume ? Math.round(Number(attrs.lastVolume)) : 0;

      return {
        malId: `md-${item.id}`,
        title,
        author,
        genre: genres,
        totalChapters: chaptersNum > 0 ? chaptersNum : 0,
        totalVolumes: volumesNum > 0 ? volumesNum : 1,
        coverUrl,
        synopsis,
        status: attrs.status || 'ongoing',
        source: 'MangaDex',
      };
    });
  } catch {
    clearTimeout(timer);
    return [];
  }
}

/**
 * Enriquece dinamicamente obras em andamento com a contagem real de capítulos lançados
 */
async function enrichOngoingChapters(results: JikanMangaSearchResult[]): Promise<JikanMangaSearchResult[]> {
  return Promise.all(
    results.map(async (item, idx) => {
      // Prioriza enriquecer os 4 primeiros resultados da busca para velocidade
      if (idx >= 4) {
        if (!item.totalChapters || item.totalChapters <= 0) {
          return {
            ...item,
            totalChapters: item.totalVolumes && item.totalVolumes > 1 ? item.totalVolumes * 10 : 100,
          };
        }
        return item;
      }

      const isOngoingOrMissing =
        !item.totalChapters ||
        item.totalChapters <= 0 ||
        item.status === 'Publishing' ||
        item.status === 'RELEASING' ||
        item.status === 'ongoing';

      if (isOngoingOrMissing) {
        const mdId = item.source === 'MangaDex' ? String(item.malId).replace('md-', '') : undefined;
        const resolvedCh = await resolveOngoingMangaLatestChapter(item.title, mdId, 2500);

        if (resolvedCh > 0) {
          return {
            ...item,
            totalChapters: resolvedCh,
          };
        }

        // Se MangaDex não respondeu mas temos contagem de volumes (ex: 75 volumes * 10 = ~750 capítulos)
        if (item.totalVolumes && item.totalVolumes > 2) {
          return {
            ...item,
            totalChapters: item.totalVolumes * 10,
          };
        }

        // Se ainda for 0, deixa um padrão razoável de 100 em vez do limite falso de 50
        if (!item.totalChapters || item.totalChapters <= 0) {
          return {
            ...item,
            totalChapters: 100,
          };
        }
      }

      return item;
    })
  );
}

// Cascata de 3 Níveis para Mangás (Jikan -> AniList -> MangaDex) com resolução viva de capítulos
export async function searchJikanManga(query: string): Promise<JikanMangaSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  // Nível 1: Tenta Jikan / MyAnimeList primeiro
  let results = await fetchFromJikan(query, 3500);

  // Nível 2: Se falhar ou demorar, tenta AniList
  if (results.length === 0) {
    results = await fetchFromAniList(query, 3000);
  }

  // Nível 3: Se nenhum dos dois achar, tenta MangaDex (Capas HD + PT-BR)
  if (results.length === 0) {
    results = await fetchFromMangaDex(query, 3500);
  }

  if (results.length === 0) return [];

  // Enriquecimento dinâmico de capítulos para obras em andamento (One Piece, Kingdom, etc.)
  return enrichOngoingChapters(results);
}
