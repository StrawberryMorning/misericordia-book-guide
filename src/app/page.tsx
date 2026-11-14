'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import FilterBar from '@/components/FilterBar';
import BookCard from '@/components/BookCard';
import BookModal from '@/components/BookModal';
import BookDetailModal from '@/components/BookDetailModal';
import { Book, BookStatus, SortOption } from '@/types/book';
import { getStoredBooks, saveStoredBooks } from '@/lib/storage';
import { BookOpen, Plus } from 'lucide-react';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filters & Sorting
  const [selectedStatus, setSelectedStatus] = useState<'all' | BookStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearchPreFill, setModalSearchPreFill] = useState('');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedDetailBook, setSelectedDetailBook] = useState<Book | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const loaded = getStoredBooks();
    setBooks(loaded);
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage whenever books change
  const handleUpdateBooks = (newBooks: Book[]) => {
    setBooks(newBooks);
    saveStoredBooks(newBooks);
  };

  // Add or Edit book
  const handleSaveBook = (bookData: Partial<Book>) => {
    if (editingBook) {
      // Editing
      const updated = books.map((b) =>
        b.id === editingBook.id
          ? {
              ...b,
              ...bookData,
              updatedAt: new Date().toISOString(),
            }
          : b
      );
      handleUpdateBooks(updated);
      setEditingBook(null);
    } else {
      // Creating new
      const newBook: Book = {
        id: 'book-' + Date.now(),
        title: bookData.title || '',
        author: bookData.author || '',
        genre: bookData.genre || 'Geral',
        totalPages: bookData.totalPages || 100,
        currentPage: bookData.currentPage || 0,
        status: bookData.status || 'want_to_read',
        rating: bookData.rating || 0,
        mediaType: bookData.mediaType || 'book',
        unitType: bookData.unitType || (bookData.mediaType === 'manga' ? 'chapters' : 'pages'),
        coverUrl: bookData.coverUrl || '',
        notes: bookData.notes || '',
        favoriteQuote: bookData.favoriteQuote || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      handleUpdateBooks([newBook, ...books]);
    }
  };

  // Delete book
  const handleDeleteBook = (id: string) => {
    const updated = books.filter((b) => b.id !== id);
    handleUpdateBooks(updated);
    if (selectedDetailBook?.id === id) setSelectedDetailBook(null);
  };

  // Quick page progress update
  const handleUpdatePages = (id: string, newPage: number) => {
    const updated = books.map((b) => {
      if (b.id !== id) return b;
      const isComplete = newPage >= b.totalPages;
      return {
        ...b,
        currentPage: newPage,
        status: isComplete ? ('completed' as BookStatus) : b.status === 'want_to_read' ? ('reading' as BookStatus) : b.status,
        updatedAt: new Date().toISOString(),
      };
    });
    handleUpdateBooks(updated);

    if (selectedDetailBook && selectedDetailBook.id === id) {
      setSelectedDetailBook((prev) =>
        prev
          ? {
              ...prev,
              currentPage: newPage,
              status: newPage >= prev.totalPages ? 'completed' : prev.status,
            }
          : null
      );
    }
  };

  // Import books backup
  const handleImportBooks = (imported: Book[]) => {
    handleUpdateBooks(imported);
  };

  // Filtered & Sorted books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Status filter
        if (selectedStatus !== 'all' && book.status !== selectedStatus) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = book.title?.toLowerCase().includes(q);
          const matchAuthor = book.author?.toLowerCase().includes(q);
          const matchGenre = book.genre?.toLowerCase().includes(q);
          const matchNotes = book.notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchAuthor && !matchGenre && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'pages') return (b.totalPages || 0) - (a.totalPages || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'progress') {
          const pA = a.totalPages > 0 ? (a.currentPage || 0) / a.totalPages : 0;
          const pB = b.totalPages > 0 ? (b.currentPage || 0) / b.totalPages : 0;
          return pB - pA;
        }
        // default: 'recent'
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      });
  }, [books, selectedStatus, searchQuery, sortBy]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50/60 dark:bg-zinc-950">
        <div className="text-center">
          <BookOpen className="w-8 h-8 text-amber-600 animate-bounce mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-500">Abrindo sua biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <Header
        books={books}
        onOpenNewModal={() => {
          setEditingBook(null);
          setIsModalOpen(true);
        }}
        onImportBooks={handleImportBooks}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Banner */}
        <div className="mb-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Le Loisir &bull; Minha Estante
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Acompanhe suas leituras de livros e mangás, registre citações marcantes e cultive seu momento de lazer.
          </p>
        </div>

        {/* Stats Dashboard */}
        <StatsCards books={books} />

        {/* Filters and Search Bar */}
        <FilterBar
          books={books}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Books Grid or Empty State */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pb-16">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={(b) => setSelectedDetailBook(b)}
                onEdit={(b) => {
                  setEditingBook(b);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteBook}
                onUpdatePages={handleUpdatePages}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white dark:bg-zinc-900/60 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 my-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-lg font-bold text-zinc-800 dark:text-zinc-200">
              Nenhum livro encontrado
            </h3>
            {searchQuery ? (
              <div className="space-y-4 mt-2">
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Nenhum livro chamado &ldquo;{searchQuery}&rdquo; foi adicionado à sua estante pessoal ainda.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={() => {
                      setEditingBook(null);
                      setModalSearchPreFill(searchQuery);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/30 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Buscar &ldquo;{searchQuery}&rdquo; online para cadastrar
                  </button>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-200 transition-colors"
                  >
                    Limpar filtro
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Você ainda não cadastrou nenhum livro nesta categoria.
                </p>
                <button
                  onClick={() => {
                    setEditingBook(null);
                    setModalSearchPreFill('');
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" /> Cadastrar Meu Primeiro Livro
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer with Manhã de Morango branding & Version Tracker */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 py-8 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand Signature */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-rose-500/80 shadow-md shadow-rose-500/20 flex-shrink-0 bg-rose-100 dark:bg-rose-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/strawberry-elephant.jpg"
                alt="Elefante de Morango - Manhã de Morango"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Manhã de Morango
                </span>
                <span className="text-xs">🍓</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Criado por{' '}
                <a
                  href="https://github.com/StrawberryMorning"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-rose-600 dark:text-rose-400 hover:underline"
                >
                  @StrawberryMorning
                </a>
              </p>
            </div>
          </div>

          {/* App Name and Philosophy */}
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <p className="font-serif italic text-zinc-700 dark:text-zinc-300">
              Le Loisir &bull; O tempo dedicado ao que realmente importa
            </p>
          </div>

          {/* Version Tracker Badge (SemVer) */}
          <div className="flex items-center gap-2">
            <div
              title="Versionamento Semântico: v1.2.0 (Suporte a Mangás & Open Library)"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>v1.2.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Add / Edit Modal */}
      <BookModal
        isOpen={isModalOpen}
        initialData={editingBook}
        initialSearchQuery={modalSearchPreFill}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBook(null);
          setModalSearchPreFill('');
        }}
        onSave={handleSaveBook}
      />

      {/* Detail Inspector Modal */}
      <BookDetailModal
        book={selectedDetailBook}
        onClose={() => setSelectedDetailBook(null)}
        onEdit={(b) => {
          setSelectedDetailBook(null);
          setEditingBook(b);
          setIsModalOpen(true);
        }}
        onUpdatePages={handleUpdatePages}
      />
    </div>
  );
}
