'use client';

import React from 'react';
import { Book, BookStatus, SortOption } from '@/types/book';
import { Search, ArrowUpDown, X } from 'lucide-react';

interface FilterBarProps {
  books: Book[];
  selectedStatus: 'all' | BookStatus;
  onSelectStatus: (status: 'all' | BookStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function FilterBar({
  books,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: FilterBarProps) {
  const counts = {
    all: books.length,
    reading: books.filter((b) => b.status === 'reading').length,
    want_to_read: books.filter((b) => b.status === 'want_to_read').length,
    completed: books.filter((b) => b.status === 'completed').length,
    abandoned: books.filter((b) => b.status === 'abandoned').length,
  };

  const tabs: { id: 'all' | BookStatus; label: string; count: number }[] = [
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'reading', label: 'Lendo', count: counts.reading },
    { id: 'want_to_read', label: 'Quero Ler', count: counts.want_to_read },
    { id: 'completed', label: 'Concluídos', count: counts.completed },
    { id: 'abandoned', label: 'Abandonados', count: counts.abandoned },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título, autor ou gênero..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-zinc-950 dark:text-zinc-100 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="pl-8 pr-8 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-950 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 cursor-pointer appearance-none transition-all"
            >
              <option value="recent">Mais Recentes</option>
              <option value="rating">Maior Avaliação</option>
              <option value="progress">Progresso (%)</option>
              <option value="title">Título (A-Z)</option>
              <option value="pages">Número de Páginas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectStatus(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-amber-700/60 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
