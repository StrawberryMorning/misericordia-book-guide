'use client';

import React, { useRef } from 'react';
import { BookOpen, Plus, Download, Upload } from 'lucide-react';
import { Book } from '@/types/book';
import { exportBooksAsJSON } from '@/lib/storage';

interface HeaderProps {
  books: Book[];
  onOpenNewModal: () => void;
  onImportBooks: (imported: Book[]) => void;
}

export default function Header({ books, onOpenNewModal, onImportBooks }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          onImportBooks(parsed);
          alert(`${parsed.length} livros importados com sucesso!`);
        } else {
          alert('Arquivo JSON inválido.');
        }
      } catch {
        alert('Erro ao processar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="border-b border-amber-900/10 dark:border-amber-100/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Le Loisir <span className="text-rose-600 dark:text-rose-400 font-sans font-medium text-xs sm:text-sm tracking-normal">🍓</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 px-2 py-0.5 rounded-full">
                Manhã de Morango
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Seu santuário de leitura &amp; mangás
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Export button */}
          <button
            onClick={() => exportBooksAsJSON(books)}
            title="Exportar backup em JSON"
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-700/60 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Exportar</span>
          </button>

          {/* Import button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar backup JSON"
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-700/60 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden md:inline">Importar</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Add Book CTA */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-sm font-semibold shadow-md shadow-amber-600/25 hover:shadow-lg transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Livro</span>
          </button>
        </div>
      </div>
    </header>
  );
}
