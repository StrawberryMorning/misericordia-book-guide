'use client';

import React from 'react';
import { Book } from '@/types/book';
import { BookOpen, CheckCircle2, Bookmark, Star } from 'lucide-react';

interface StatsCardsProps {
  books: Book[];
}

export default function StatsCards({ books }: StatsCardsProps) {
  const reading = books.filter((b) => b.status === 'reading').length;
  const completed = books.filter((b) => b.status === 'completed').length;
  const wantToRead = books.filter((b) => b.status === 'want_to_read').length;

  const totalPagesRead = books.reduce((acc, b) => acc + (b.currentPage || 0), 0);

  const ratedBooks = books.filter((b) => b.rating > 0);
  const avgRating =
    ratedBooks.length > 0
      ? (ratedBooks.reduce((acc, b) => acc + b.rating, 0) / ratedBooks.length).toFixed(1)
      : '0.0';

  const stats = [
    {
      label: 'Lendo Agora',
      value: reading,
      sub: `${reading === 1 ? 'livro em andamento' : 'livros em andamento'}`,
      icon: BookOpen,
      color: 'from-amber-500 to-amber-600',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Concluídos',
      value: completed,
      sub: `${totalPagesRead.toLocaleString('pt-BR')} páginas lidas`,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Quero Ler',
      value: wantToRead,
      sub: `Fila de desejos`,
      icon: Bookmark,
      color: 'from-sky-500 to-blue-600',
      badgeBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    },
    {
      label: 'Nota Média',
      value: avgRating,
      sub: `${ratedBooks.length} avaliados`,
      icon: Star,
      color: 'from-amber-400 to-orange-500',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-850/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </span>
              <div className={`p-2 rounded-xl ${stat.badgeBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold font-serif text-zinc-900 dark:text-zinc-100">
                {stat.value}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
              {stat.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}
