'use client';

import React, { useState, useEffect } from 'react';
import { Book, BookStatus, MediaType, UnitType } from '@/types/book';
import { X, Search, Sparkles, Star, BookOpen, Loader2 } from 'lucide-react';
import { searchGoogleBooks, GoogleBookSearchResult } from '@/lib/googleBooks';
import { searchJikanManga, JikanMangaSearchResult } from '@/lib/jikanApi';

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

  // Auto-search provider: 'books' (Google Books) vs 'manga' (Jikan / MAL)
  const [searchProvider, setSearchProvider] = useState<'books' | 'manga'>('books');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookResults, setBookResults] = useState<GoogleBookSearchResult[]>([]);
  const [mangaResults, setMangaResults] = useState<JikanMangaSearchResult[]>([]);

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
      setGenre('Literatura');
      setTotalPages(200);
      setCurrentPage(0);
      setStatus('want_to_read');
      setRating(0);
      setMediaType('book');
      setUnitType('pages');
      setCoverUrl('');
      setNotes('');
      setFavoriteQuote('');
    }
    setBookResults([]);
    setMangaResults([]);
    setHasSearched(false);

    if (initialSearchQuery && !initialData) {
      setSearchQuery(initialSearchQuery);
      setIsSearching(true);
      setHasSearched(true);
      searchGoogleBooks(initialSearchQuery).then((results) => {
        setBookResults(results);
        setIsSearching(false);
      });
    } else {
      setSearchQuery('');
    }
  }, [initialData, isOpen, initialSearchQuery]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    setBookResults([]);
    setMangaResults([]);

    try {
      if (searchProvider === 'books') {
        const results = await searchGoogleBooks(searchQuery);
        setBookResults(results);
      } else {
        const results = await searchJikanManga(searchQuery);
        setMangaResults(results);
      }
    } finally {
      setIsSearching(false);
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
                  Auto-preenchimento Inteligente
                </label>

                {/* Source Toggle: Google Books vs Jikan/MAL */}
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
                    ⛩️ Mangás (Jikan)
                  </button>
                </div>
              </div>

              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    searchProvider === 'books'
                      ? 'Buscar livro (ex: Dom Casmurro, Sapiens...)'
                      : 'Buscar mangá no MyAnimeList (ex: Berserk, One Piece...)'
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

              {/* Google Books search suggestions */}
              {bookResults.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto border-t border-amber-200/60 dark:border-amber-900/40 pt-2">
                  <p className="text-[11px] font-medium text-amber-800 dark:text-amber-400">
                    Livros encontrados (Google Books):
                  </p>
                  {bookResults.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectGoogleBook(res)}
                      className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 hover:bg-amber-100 dark:hover:bg-amber-950/50 cursor-pointer flex items-center gap-3 transition-colors text-left"
                    >
                      {res.coverUrl ? (
                        <img src={res.coverUrl} alt={res.title} className="w-7 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-7 h-10 bg-zinc-200 dark:bg-zinc-700 rounded flex items-center justify-center">
                          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 font-medium truncate">
                          {res.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {res.author} • {res.totalPages} páginas
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Jikan Manga search suggestions */}
              {mangaResults.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto border-t border-amber-200/60 dark:border-amber-900/40 pt-2">
                  <p className="text-[11px] font-medium text-amber-800 dark:text-amber-400">
                    Mangás encontrados ({mangaResults[0]?.source || 'Catálogo Online'}):
                  </p>
                  {mangaResults.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectJikanManga(res)}
                      className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 hover:bg-amber-100 dark:hover:bg-amber-950/50 cursor-pointer flex items-center gap-3 transition-colors text-left"
                    >
                      {res.coverUrl ? (
                        <img src={res.coverUrl} alt={res.title} className="w-7 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-7 h-10 bg-zinc-200 dark:bg-zinc-700 rounded flex items-center justify-center">
                          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 font-medium truncate">
                            {res.title}
                          </p>
                          {res.score && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded">
                              ★ {res.score.toFixed(1)}
                            </span>
                          )}
                          <span className="text-[9px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 px-1 rounded ml-auto">
                            {res.source}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {res.author} • {res.totalChapters} capítulos • {res.genre}
                        </p>
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
                  max={totalPages}
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
                  value={totalPages}
                  onChange={(e) => setTotalPages(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
                />
              </div>
            </div>

            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Sua Avaliação
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className="p-1 text-zinc-300 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-300 dark:text-zinc-700'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-zinc-500 ml-2">
                  {rating === 0 ? 'Sem avaliação' : `${rating} estrela${rating > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Favorite Quote */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Citação / Frase Marcante
              </label>
              <input
                type="text"
                value={favoriteQuote}
                onChange={(e) => setFavoriteQuote(e.target.value)}
                placeholder="Uma frase inesquecível da obra..."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium italic"
              />
            </div>

            {/* Notes / Review */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Anotações, Reflexões ou Resenha
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="O que você achou? O que esta obra te transmitiu?"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="book-form"
            className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/30 transition-all active:scale-95"
          >
            {initialData ? 'Salvar Alterações' : 'Cadastrar Obra'}
          </button>
        </div>
      </div>
    </div>
  );
}
