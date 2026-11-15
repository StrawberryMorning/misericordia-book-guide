'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import FilterBar from '@/components/FilterBar';
import BookCard from '@/components/BookCard';
import BookModal from '@/components/BookModal';
import BookDetailModal from '@/components/BookDetailModal';
import AuthModal from '@/components/AuthModal';
import AdminModal from '@/components/AdminModal';
import ProfileModal from '@/components/ProfileModal';
import AdminFloatingCockpit from '@/components/AdminFloatingCockpit';
import { Book, BookStatus, SortOption } from '@/types/book';
import { saveStoredBooks } from '@/lib/storage';
import { getSupabaseClient } from '@/lib/supabaseClient';
import {
  fetchBooks,
  syncSaveBook,
  syncDeleteBook,
  migrateLocalBooksToCloud,
} from '@/lib/bookService';
import { isAdminUser } from '@/lib/admin';
import { BookOpen, Plus, CheckCircle2, Megaphone } from 'lucide-react';
import packageInfo from '../../package.json';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Announcement state
  const [announcement, setAnnouncement] = useState<string>('');

  // Filters & Sorting
  const [selectedStatus, setSelectedStatus] = useState<'all' | BookStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [modalSearchPreFill, setModalSearchPreFill] = useState('');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedDetailBook, setSelectedDetailBook] = useState<Book | null>(null);

  // Check if current logged-in user is Admin
  const isAdmin = useMemo(() => isAdminUser(userEmail), [userEmail]);

  // Load announcement from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotice = localStorage.getItem('le_loisir_announcement');
      if (savedNotice) {
        setAnnouncement(savedNotice);
      } else {
        setAnnouncement('🍓 Bem-vindo ao Le Loisir! Aproveite suas leituras e registre suas reflexões.');
      }
    }
  }, []);

  const handleSaveAnnouncement = (msg: string) => {
    setAnnouncement(msg);
    if (typeof window !== 'undefined') {
      if (msg) {
        localStorage.setItem('le_loisir_announcement', msg);
      } else {
        localStorage.removeItem('le_loisir_announcement');
      }
    }
  };

  // Load books and auth state on mount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      // 1. Load books (local or cloud if already logged in)
      const initialBooks = await fetchBooks();
      if (isMounted) {
        setBooks(initialBooks);
        setIsLoaded(true);
      }

      // 2. Check current Supabase session
      const client = getSupabaseClient();
      if (client) {
        const { data: { user } } = await client.auth.getUser();
        if (user && isMounted) {
          setUserEmail(user.email || null);
          const dName = user.user_metadata?.display_name || user.email?.split('@')[0] || '';
          setUserName(dName);
        }

        // 3. Listen to auth changes
        const { data: { subscription } } = client.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;
            if (session?.user) {
              setUserEmail(session.user.email || null);
              const dName =
                session.user.user_metadata?.display_name ||
                session.user.email?.split('@')[0] ||
                '';
              setUserName(dName);

              if (event === 'SIGNED_IN') {
                const count = await migrateLocalBooksToCloud();
                if (count > 0) {
                  setToastMessage(`${count} livros salvos foram sincronizados na sua conta! 🍓`);
                  setTimeout(() => setToastMessage(null), 4000);
                }
                const cloudBooks = await fetchBooks();
                setBooks(cloudBooks);
              }
            } else if (event === 'SIGNED_OUT') {
              setUserEmail(null);
              setUserName('');
              const localBooks = await fetchBooks();
              setBooks(localBooks);
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Add or Edit book
  const handleSaveBook = (bookData: Partial<Book>) => {
    if (editingBook) {
      // Editing
      const updatedBook: Book = {
        ...editingBook,
        ...bookData,
        updatedAt: new Date().toISOString(),
      };
      setBooks((prev) => prev.map((b) => (b.id === editingBook.id ? updatedBook : b)));
      syncSaveBook(updatedBook);
      setEditingBook(null);
      if (selectedDetailBook?.id === editingBook.id) {
        setSelectedDetailBook(updatedBook);
      }
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
      setBooks((prev) => [newBook, ...prev]);
      syncSaveBook(newBook);
    }
  };

  // Delete book
  const handleDeleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    syncDeleteBook(id);
    if (selectedDetailBook?.id === id) setSelectedDetailBook(null);
  };

  // Quick page progress update
  const handleUpdatePages = (id: string, newPage: number) => {
    const target = books.find((b) => b.id === id);
    if (!target) return;

    const isComplete = newPage >= target.totalPages;
    const updatedBook: Book = {
      ...target,
      currentPage: newPage,
      status: isComplete
        ? ('completed' as BookStatus)
        : target.status === 'want_to_read'
        ? ('reading' as BookStatus)
        : target.status,
      updatedAt: new Date().toISOString(),
    };

    setBooks((prev) => prev.map((b) => (b.id === id ? updatedBook : b)));
    syncSaveBook(updatedBook);

    if (selectedDetailBook && selectedDetailBook.id === id) {
      setSelectedDetailBook(updatedBook);
    }
  };

  // Import books backup
  const handleImportBooks = (imported: Book[]) => {
    setBooks(imported);
    saveStoredBooks(imported);
    imported.forEach((b) => syncSaveBook(b));
  };

  // Sign out
  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
      setUserEmail(null);
      setUserName('');
      setToastMessage('Você saiu da conta. Seus dados continuam no cache deste dispositivo.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Auth success callback
  const handleAuthSuccess = async () => {
    const client = getSupabaseClient();
    if (client) {
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        const dName = user.user_metadata?.display_name || user.email?.split('@')[0] || '';
        setUserName(dName);
        const count = await migrateLocalBooksToCloud();
        const cloudBooks = await fetchBooks();
        setBooks(cloudBooks);
        if (count > 0) {
          setToastMessage(`${count} obras sincronizadas com sua conta nuvem! ✨`);
          setTimeout(() => setToastMessage(null), 4000);
        }
      }
    }
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
        return (
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
        );
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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header with Creator / Admin & Display Name support */}
      <Header
        books={books}
        userEmail={userEmail}
        userName={userName}
        isAdmin={isAdmin}
        onOpenNewModal={() => {
          setEditingBook(null);
          setIsModalOpen(true);
        }}
        onImportBooks={handleImportBooks}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Creator Announcement Banner (if configured) */}
        {announcement && (
          <div className="mb-5 p-3.5 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-zinc-800 dark:text-zinc-200 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Megaphone className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span className="font-medium truncate sm:whitespace-normal">{announcement}</span>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-semibold flex-shrink-0"
              >
                Editar
              </button>
            )}
          </div>
        )}

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
              title={`Versionamento Semântico: v${packageInfo.version} (Resolução Dinâmica de Capítulos MangaDex & Cascata Multi-API)`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>v{packageInfo.version}</span>
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

      {/* Auth / Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Creator / Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        userEmail={userEmail || ''}
        books={books}
        announcement={announcement}
        onSaveAnnouncement={handleSaveAnnouncement}
      />

      {/* Profile Edit Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userEmail={userEmail || ''}
        currentName={userName}
        onUpdateName={(newName) => {
          setUserName(newName);
          setToastMessage('Nome de perfil atualizado com sucesso! ✨');
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />

      {/* Floating Admin Cockpit Drawer (Exclusive to quebragelo@proton.me) */}
      <AdminFloatingCockpit
        isAdmin={isAdmin}
        userEmail={userEmail}
        books={books}
        announcement={announcement}
        onSaveAnnouncement={handleSaveAnnouncement}
      />
    </div>
  );
}
