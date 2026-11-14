'use client';

import React, { useRef } from 'react';
import { BookOpen, Plus, Download, Upload, Cloud, UserCheck, LogOut, Crown, Edit3 } from 'lucide-react';
import { Book } from '@/types/book';
import { exportBooksAsJSON } from '@/lib/storage';

interface HeaderProps {
  books: Book[];
  userEmail?: string | null;
  userName?: string | null;
  isAdmin?: boolean;
  onOpenNewModal: () => void;
  onImportBooks: (imported: Book[]) => void;
  onOpenAuthModal: () => void;
  onOpenAdminModal?: () => void;
  onOpenProfileModal?: () => void;
  onSignOut: () => void;
}

export default function Header({
  books,
  userEmail,
  userName,
  isAdmin = false,
  onOpenNewModal,
  onImportBooks,
  onOpenAuthModal,
  onOpenAdminModal,
  onOpenProfileModal,
  onSignOut,
}: HeaderProps) {
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

  const displayName = userName || userEmail?.split('@')[0] || '';

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
          {/* Cloud Auth / Admin Button */}
          {userEmail ? (
            isAdmin ? (
              /* Selo Especial do Criador / ADM */
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border border-amber-500/40 dark:border-amber-400/40 rounded-xl px-2.5 py-1 text-xs shadow-sm shadow-amber-500/10">
                <button
                  type="button"
                  onClick={onOpenAdminModal}
                  className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
                  title="Abrir Painel do Criador (ADM)"
                >
                  <Crown className="w-4 h-4 text-amber-500 animate-pulse flex-shrink-0" />
                  <span className="hidden sm:inline">Criador 🍓</span>
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium max-w-[90px] truncate">
                    ({displayName})
                  </span>
                </button>
                <div className="w-px h-3.5 bg-amber-500/30 mx-0.5" />
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  title="Editar nome de perfil"
                  className="text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onSignOut}
                  title="Sair da conta de Criador"
                  className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              /* Usuário Comum com Nome de Exibição e Botão de Editar */
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-2.5 py-1 text-xs">
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium hover:underline max-w-[120px] truncate"
                  title="Clique para editar seu nome de exibição"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{displayName}</span>
                  <Edit3 className="w-3 h-3 text-emerald-600/70" />
                </button>
                <div className="w-px h-3.5 bg-emerald-300 dark:bg-emerald-800 mx-0.5" />
                <button
                  onClick={onSignOut}
                  title="Sair da conta"
                  className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="Sincronizar em Nuvem / Criar Conta"
              className="px-2.5 sm:px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-700/60 rounded-lg transition-all flex items-center gap-1.5"
            >
              <Cloud className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Nuvem</span>
            </button>
          )}

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
            <span>Novo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
