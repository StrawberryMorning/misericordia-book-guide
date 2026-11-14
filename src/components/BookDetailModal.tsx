'use client';

import React, { useState } from 'react';
import { Book } from '@/types/book';
import { X, Star, Quote, Edit2, BookOpen } from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onEdit: (book: Book) => void;
  onUpdatePages: (id: string, newPage: number) => void;
}

export default function BookDetailModal({
  book,
  onClose,
  onEdit,
  onUpdatePages,
}: BookDetailModalProps) {
  const [pageInput, setPageInput] = useState<number | string>('');

  if (!book) return null;

  const percent =
    book.totalPages > 0
      ? Math.min(100, Math.round(((book.currentPage || 0) / book.totalPages) * 100))
      : 0;

  const unit = book.unitType || (book.mediaType === 'manga' ? 'chapters' : 'pages');
  const unitLabel = unit === 'chapters' ? 'capítulos' : unit === 'volumes' ? 'volumes' : 'páginas';

  const handlePageUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pageInput === '') return;
    const val = Number(pageInput);
    if (!isNaN(val)) {
      onUpdatePages(book.id, Math.min(book.totalPages, Math.max(0, val)));
      setPageInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="relative bg-gradient-to-r from-amber-800 via-amber-900 to-zinc-950 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-200 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
              {book.mediaType === 'manga' ? '⛩️ Mangá • ' : ''}{book.genre}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Top Info Row: Cover + Details */}
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            {/* Book Cover Container - Full Unclipped Artwork */}
            <div className="w-32 sm:w-36 h-48 sm:h-52 rounded-2xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800 flex-shrink-0 bg-zinc-950 flex items-center justify-center p-1.5">
              {book.coverUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-700 to-zinc-900 p-3 flex flex-col justify-between text-white rounded-xl">
                  <BookOpen className="w-6 h-6 text-amber-300" />
                  <p className="font-serif text-xs font-bold leading-tight">{book.title}</p>
                  <p className="text-[10px] text-zinc-300">{book.author}</p>
                </div>
              )}
            </div>

            {/* Title, Author, Rating & Actions */}
            <div className="flex-1 min-w-0 w-full text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                    {book.title}
                  </h2>
                  <p className="text-base text-zinc-600 dark:text-zinc-400 font-medium mt-1">
                    {book.author}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onEdit(book);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors flex-shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= book.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-300 dark:text-zinc-700'
                    }`}
                  />
                ))}
                {book.rating > 0 && (
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 ml-1.5">
                    {book.rating}.0 de 5.0
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Tracker Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-2">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                Progresso: {percent}%
              </span>
              <span>
                {book.currentPage} de {book.totalPages} {unitLabel}
              </span>
            </div>
            <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* Quick update input */}
            <form onSubmit={handlePageUpdateSubmit} className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={book.totalPages}
                placeholder={`Ir para ${unit === 'chapters' ? 'capítulo' : unit === 'volumes' ? 'volume' : 'página'}... (atual: ${book.currentPage})`}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-950 dark:text-zinc-100 font-medium"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Atualizar Progresso
              </button>
            </form>
          </div>

          {/* Quote */}
          {book.favoriteQuote && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 relative">
              <Quote className="w-6 h-6 text-amber-500/30 absolute top-3 right-3" />
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">
                Frase Marcante:
              </p>
              <p className="font-serif italic text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                &ldquo;{book.favoriteQuote}&rdquo;
              </p>
            </div>
          )}

          {/* Notes */}
          {book.notes ? (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Minhas Anotações &amp; Resenha
              </h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                {book.notes}
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">
              Nenhuma anotação adicionada ainda. Clique em &ldquo;Editar&rdquo; para registrar suas reflexões.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
