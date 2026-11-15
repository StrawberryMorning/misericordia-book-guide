'use client';

import React, { useState, useEffect } from 'react';
import { Book, BookStatus, MediaType, UnitType } from '@/types/book';
import { X, Search, Sparkles, Star, BookOpen, Loader2, Eye, ZoomIn } from 'lucide-react';
import { searchGoogleBooks, GoogleBookSearchResult } from '@/lib/googleBooks';
import { searchJikanManga, JikanMangaSearchResult } from '@/lib/jikanApi';
import ImageLightboxModal from '@/components/ImageLightboxModal';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookData: Partial<Book>) => void;
  initialData?: Book | null;
  initialSearchQuery?: string;
}

export default function BookModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  initialSearchQuery,
}: BookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [totalPages, setTotalPages] = useState<number>(200);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [status, setStatus] = useState<BookStatus>('want_to_read');
  const [rating, setRating] = useState<number>(0);
  const [mediaType, setMediaType] = useState<MediaType>('book');
  const [unitType, setUnitType] = useState<UnitType>('pages');
  const [coverUrl, setCoverUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [favoriteQuote, setFavoriteQuote] = useState('');

  // Auto-search provider: 'books' (Google Books + Open Library) vs 'manga' (Jikan + AniList + MangaDex)
  const [searchProvider, setSearchProvider] = useState<'books' | 'manga'>('books');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookResults, setBookResults] = useState<GoogleBookSearchResult[]>([]);
  const [mangaResults, setMangaResults] = useState<JikanMangaSearchResult[]>([]);

  // Lightbox state for artwork inspection
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    author?: string;
    onSelect?: () => void;
    selectLabel?: string;
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
  });

  const openLightbox = (
    imageUrl: string,
    itemTitle: string,
    itemAuthor?: string,
    onSelect?: () => void,
    selectLabel?: string
  ) => {
    setLightboxState({
      isOpen: true,
      imageUrl,
      title: itemTitle,
      author: itemAuthor,
      onSelect,
      selectLabel,
    });
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setAuthor(initialData.author || '');
      setGenre(initialData.genre || '');
      setTotalPages(initialData.totalPages || 100);
      setCurrentPage(initialData.currentPage || 0);
      setStatus(initialData.status || 'want_to_read');
      setRating(initialData.rating || 0);
      setMediaType(initialData.mediaType || 'book');
      setUnitType(initialData.unitType || (initialData.mediaType === 'manga' ? 'chapters' : 'pages'));
      setCoverUrl(initialData.coverUrl || '');
      setNotes(initialData.notes || '');
      setFavoriteQuote(initialData.favoriteQuote || '');
    } else {
      setTitle('');
      setAuthor('');
      setGenre('');
      setTotalPages(200);
      setCurrentPage(0);
      setStatus('want_to_read');
      setRating(0);
      setMediaType('book');
      setUnitType('pages');
      setCoverUrl('');
      setNotes('');
      setFavoriteQuote('');
      setBookResults([]);
      setMangaResults([]);
      setHasSearched(false);

      if (initialSearchQuery) {
        setSearchQuery(initialSearchQuery);
      } else {
        setSearchQuery('');
      }
    }
  }, [initialData, initialSearchQuery, isOpen]);

  // Execute initial search if opened with a search pre-fill
  useEffect(() => {
    if (isOpen && !initialData && initialSearchQuery && initialSearchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchGoogleBooks(initialSearchQuery)
        .then((res) => {
          setBookResults(res);
          setHasSearched(true);
        })
        .finally(() => setIsSearching(false));
    }
  }, [isOpen, initialData, initialSearchQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setIsSearching(true);
    setHasSearched(true);

    if (searchProvider === 'books') {
      try {
        const results = await searchGoogleBooks(searchQuery);
        setBookResults(results);
        setMangaResults([]);
      } catch {
        setBookResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      try {
        const results = await searchJikanManga(searchQuery);
        setMangaResults(results);
        setBookResults([]);
      } catch {
        setMangaResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleSelectGoogleBook = (result: GoogleBookSearchResult) => {
    setTitle(result.title);
    setAuthor(result.author);
    setMediaType('book');
    setUnitType('pages');
    if (result.genre) setGenre(result.genre);
    if (result.totalPages) setTotalPages(result.totalPages);
    if (result.coverUrl) setCoverUrl(result.coverUrl);
    if (result.description && !notes) setNotes(result.description.slice(0, 300) + '...');
    setBookResults([]);
  };

  const handleSelectJikanManga = (result: JikanMangaSearchResult) => {
    setTitle(result.title);
    setAuthor(result.author);
    setMediaType('manga');
    setUnitType('chapters');
    if (result.genre) setGenre(result.genre);
    if (result.totalChapters) setTotalPages(result.totalChapters);
    if (result.coverUrl) setCoverUrl(result.coverUrl);
    if (result.synopsis && !notes) setNotes(result.synopsis.slice(0, 300) + '...');
    if (result.score) {
      // Map 10-point scale to 5-star scale
      setRating(Math.round(result.score / 2));
    }
    setMangaResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      alert('Por favor, informe pelo menos o título e o autor.');
      return;
    }

    onSave({
      title: title.trim(),
      author: author.trim(),
      genre: genre.trim() || (mediaType === 'manga' ? 'Mangá' : 'Geral'),
      totalPages: Number(totalPages) > 0 ? Number(totalPages) : 100,
      currentPage: Math.min(Number(totalPages), Math.max(0, Number(currentPage))),
      status,
      rating,
      mediaType,
      unitType,
      coverUrl: coverUrl.trim(),
      notes: notes.trim(),
      favoriteQuote: favoriteQuote.trim(),
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {initialData ? 'Editar Obra' : 'Adicionar Nova Obra'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Cadastre livros, mangás ou quadrinhos na sua biblioteca
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Quick Auto-Complete Bar */}
            {!initialData && (
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-preenchimento Inteligente (Cascata)
                  </label>

                  {/* Source Toggle: Google Books + Open Library vs Jikan + AniList + MangaDex */}
                  <div className="flex bg-amber-200/60 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px] font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchProvider('books');
                        setMangaResults([]);
                      }}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        searchProvider === 'books'
                          ? 'bg-white dark:bg-zinc-700 text-amber-900 dark:text-amber-300 shadow-sm font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      📚 Livros
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchProvider('manga');
                        setBookResults([]);
                      }}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        searchProvider === 'manga'
                          ? 'bg-white dark:bg-zinc-700 text-amber-900 dark:text-amber-300 shadow-sm font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      ⛩️ Mangás (3 Níveis)
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      searchProvider === 'books'
                        ? 'Buscar livro (Google Books + Open Library)'
                        : 'Buscar mangá (MAL + AniList + MangaDex)'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Buscar
                  </button>
                </form>

                {/* Google Books + Open Library search suggestions */}
                {bookResults.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto border-t border-amber-200/60 dark:border-amber-900/40 pt-2">
                    <p className="text-[11px] font-medium text-amber-800 dark:text-amber-400">
                      Livros encontrados:
                    </p>
                    {bookResults.map((res, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectGoogleBook(res)}
                        className="group p-2 rounded-xl bg-white dark:bg-zinc-800/80 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 cursor-pointer flex items-center justify-between gap-3 transition-colors text-left border border-zinc-100 dark:border-zinc-700/60"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {res.coverUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={res.coverUrl}
                              alt={res.title}
                              className="w-8 h-11 object-contain bg-zinc-950 rounded shadow-sm flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-11 bg-zinc-200 dark:bg-zinc-700 rounded flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 truncate">
                              {res.title}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {res.author} &bull; {res.totalPages} páginas
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {res.source && (
                            <span className="text-[9px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 px-1.5 py-0.5 rounded hidden sm:inline">
                              {res.source}
                            </span>
                          )}
                          {res.coverUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(
                                  res.coverUrl!,
                                  res.title,
                                  res.author,
                                  () => handleSelectGoogleBook(res),
                                  'Selecionar este livro'
                                );
                              }}
                              title="Espiar arte da capa em tela cheia"
                              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-amber-200 dark:bg-zinc-700 dark:hover:bg-amber-900/60 text-zinc-600 dark:text-zinc-300 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3-Tier Manga search suggestions (Jikan / AniList / MangaDex) */}
                {mangaResults.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto border-t border-amber-200/60 dark:border-amber-900/40 pt-2">
                    <p className="text-[11px] font-medium text-amber-800 dark:text-amber-400">
                      Mangás encontrados (Cascata Online):
                    </p>
                    {mangaResults.map((res, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectJikanManga(res)}
                        className="group p-2 rounded-xl bg-white dark:bg-zinc-800/80 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 cursor-pointer flex items-center justify-between gap-3 transition-colors text-left border border-zinc-100 dark:border-zinc-700/60"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {res.coverUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={res.coverUrl}
                              alt={res.title}
                              className="w-8 h-11 object-contain bg-zinc-950 rounded shadow-sm flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-11 bg-zinc-200 dark:bg-zinc-700 rounded flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 truncate">
                                {res.title}
                              </p>
                              {res.score && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded flex-shrink-0">
                                  ★ {res.score.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {res.author} &bull; {res.totalChapters} caps &bull; {res.genre}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[9px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 px-1.5 py-0.5 rounded hidden sm:inline">
                            {res.source}
                          </span>
                          {res.coverUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(
                                  res.coverUrl,
                                  res.title,
                                  res.author,
                                  () => handleSelectJikanManga(res),
                                  'Selecionar este mangá'
                                );
                              }}
                              title="Espiar arte da capa em tela cheia"
                              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-amber-200 dark:bg-zinc-700 dark:hover:bg-amber-900/60 text-zinc-600 dark:text-zinc-300 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty / Not Found feedback */}
                {hasSearched && !isSearching && bookResults.length === 0 && mangaResults.length === 0 && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 flex items-center justify-between">
                    <span>
                      Nenhum resultado online para &ldquo;{searchQuery}&rdquo;.
                    </span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Preencha os campos abaixo manualmente ✍️
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Visual Cover Artwork Preview Card (when cover is available) */}
            {coverUrl && (
              <div className="p-3 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    onClick={() => openLightbox(coverUrl, title || 'Capa da Obra', author)}
                    title="Clique para ampliar a arte da capa"
                    className="relative group cursor-pointer w-12 h-16 rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0 shadow-md border border-zinc-700/60 flex items-center justify-center p-0.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverUrl} alt={title} className="w-full h-full object-contain rounded-lg" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white rounded-lg">
                      <ZoomIn className="w-4 h-4 text-amber-300" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {title || 'Capa Selecionada'}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      Arte pronta &bull; Clique para ver em alta definição
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openLightbox(coverUrl, title || 'Capa da Obra', author)}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors flex-shrink-0"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Ampliar</span>
                </button>
              </div>
            )}

            <form id="book-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Media Type & Units */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Tipo de Obra
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => {
                      const type = e.target.value as MediaType;
                      setMediaType(type);
                      setUnitType(type === 'manga' ? 'chapters' : 'pages');
                      if (type === 'manga' && genre === 'Literatura') setGenre('Mangá');
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
                  >
                    <option value="book">📚 Livro / Literatura</option>
                    <option value="manga">⛩️ Mangá / HQ / Manhwa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as UnitType)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
                  >
                    <option value="pages">Páginas</option>
                    <option value="chapters">Capítulos</option>
                    <option value="volumes">Volumes</option>
                  </select>
                </div>
              </div>

              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Título da Obra *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nome do livro ou mangá"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Autor(a) / Mangaká *
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Nome do(a) criador(a)"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
                  />
                </div>
              </div>

              {/* Genre & Cover URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Gênero / Categoria
                  </label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Shounen, Seinen, Ficção, Fantasia..."
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    URL da Capa (Opcional)
                  </label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://exemplo.com/capa.jpg"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
                  />
                </div>
              </div>

              {/* Status & Progress Units */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Status de Leitura
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const newStatus = e.target.value as BookStatus;
                      setStatus(newStatus);
                      if (newStatus === 'completed' && currentPage < totalPages) {
                        setCurrentPage(totalPages);
                      }
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
                  >
                    <option value="want_to_read">Quero Ler</option>
                    <option value="reading">Lendo</option>
                    <option value="completed">Concluído</option>
                    <option value="abandoned">Abandonado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Lido ({unitType === 'chapters' ? 'Capítulos' : unitType === 'volumes' ? 'Volumes' : 'Páginas'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Total de {unitType === 'chapters' ? 'Capítulos' : unitType === 'volumes' ? 'Volumes' : 'Páginas'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalPages}
                    onChange={(e) => setTotalPages(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Sua Avaliação
                </label>
                <div className="flex items-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star === rating ? 0 : star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="text-xs text-zinc-500 ml-2 font-medium">
                      {rating} de 5 estrelas
                    </span>
                  )}
                </div>
              </div>

              {/* Favorite Quote */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Frase Marcante / Citação Favorita
                </label>
                <input
                  type="text"
                  value={favoriteQuote}
                  onChange={(e) => setFavoriteQuote(e.target.value)}
                  placeholder="&ldquo;Uma frase que te tocou durante a leitura...&rdquo;"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium italic"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Anotações Pessoais &amp; Resenha
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escreva seus pensamentos sobre o livro ou capítulo..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium resize-none"
                />
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="book-form"
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 hover:shadow-lg transition-all"
            >
              {initialData ? 'Salvar Alterações' : 'Adicionar à Estante'}
            </button>
          </div>
        </div>
      </div>

      {/* Artwork Lightbox / Floating Zoom Window */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={lightboxState.imageUrl}
        title={lightboxState.title}
        author={lightboxState.author}
        onSelect={lightboxState.onSelect}
        selectLabel={lightboxState.selectLabel}
      />
    </>
  );
}
