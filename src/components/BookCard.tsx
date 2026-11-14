'use client';

import React from 'react';
import { Book, BookStatus } from '@/types/book';
import { Star, Edit2, Trash2, CheckCircle, BookOpen, Plus, BookmarkCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onUpdatePages: (id: string, newPage: number) => void;
  onClick: (book: Book) => void;
}

const statusConfig: Record<
  BookStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  reading: {
    label: 'Lendo',
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  want_to_read: {
    label: 'Quero Ler',
    bg: 'bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-500/30',
  },
  completed: {
    label: 'Concluído',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  abandoned: {
    label: 'Abandonado',
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-500/30',
  },
};

export default function BookCard({
  book,
  onEdit,
  onDelete,
  onUpdatePages,
  onClick,
}: BookCardProps) {
  const percent =
    book.totalPages > 0
      ? Math.min(100, Math.round(((book.currentPage || 0) / book.totalPages) * 100))
      : 0;

  const handleQuickAddPages = (e: React.MouseEvent, amount: number) => {
    e.stopPropagation();
    const target = Math.min(book.totalPages, (book.currentPage || 0) + amount);
    if (target === book.totalPages && book.status !== 'completed') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
    onUpdatePages(book.id, target);
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
    });
    onUpdatePages(book.id, book.totalPages);
  };

  const status = statusConfig[book.status] || statusConfig.want_to_read;

  return (
    <div
      onClick={() => onClick(book)}
      className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 hover:border-amber-500/40 dark:hover:border-amber-500/40 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col overflow-hidden"
    >
      <div className="p-4 sm:p-5 flex gap-4 flex-1">
        {/* Book Cover or Fallback */}
        <div className="relative w-20 sm:w-24 h-28 sm:h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-sm bg-gradient-to-br from-amber-700 via-amber-800 to-zinc-900 flex flex-col justify-between p-2">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : null}

          {/* Fallback visual typography */}
          <div className="relative z-10 flex flex-col justify-between h-full text-white">
            <span className="text-[9px] uppercase tracking-wider text-amber-200 font-semibold truncate">
              {book.genre || 'Livro'}
            </span>
            <div className="my-auto">
              <BookOpen className="w-5 h-5 text-amber-300/80 mb-1" />
              <p className="font-serif text-[11px] font-bold line-clamp-2 leading-tight">
                {book.title}
              </p>
            </div>
            <span className="text-[8px] text-zinc-300 truncate">{book.author}</span>
          </div>
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Status and Category */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${status.bg} ${status.text} ${status.border}`}
              >
                {status.label}
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate max-w-[110px]">
                {book.genre}
              </span>
            </div>

            {/* Title & Author */}
            <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
              {book.title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium truncate mb-2">
              {book.author}
            </p>

            {/* Rating Stars */}
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= book.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-zinc-300 dark:text-zinc-600'
                  }`}
                />
              ))}
              {book.rating > 0 && (
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 ml-1">
                  {book.rating}.0
                </span>
              )}
            </div>
          </div>

          {/* Reading Progress */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <span>
                {book.currentPage || 0} / {book.totalPages} págs
              </span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{percent}%</span>
            </div>

            <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  percent === 100
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
        {/* Quick progress buttons */}
        <div className="flex items-center gap-1.5">
          {book.status !== 'completed' && percent < 100 ? (
            <>
              <button
                onClick={(e) => handleQuickAddPages(e, 10)}
                title="Avançar 10 páginas"
                className="px-2 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-medium text-[11px] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> 10p
              </button>
              <button
                onClick={handleComplete}
                title="Marcar como concluído"
                className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium text-[11px] flex items-center gap-1 transition-colors"
              >
                <BookmarkCheck className="w-3 h-3" /> Terminei
              </button>
            </>
          ) : (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Leitura concluída
            </span>
          )}
        </div>

        {/* Edit and Delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(book);
            }}
            title="Editar livro"
            className="p-1.5 text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Tem certeza que deseja remover "${book.title}"?`)) {
                onDelete(book.id);
              }
            }}
            title="Excluir livro"
            className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
