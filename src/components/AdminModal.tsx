'use client';

import React, { useState } from 'react';
import {
  X,
  Crown,
  Database,
  ExternalLink,
  ShieldCheck,
  Server,
  Sparkles,
  MessageSquare,
  Check,
} from 'lucide-react';
import { Book } from '@/types/book';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  books: Book[];
  announcement: string;
  onSaveAnnouncement: (msg: string) => void;
}

export default function AdminModal({
  isOpen,
  onClose,
  userEmail,
  books,
  announcement,
  onSaveAnnouncement,
}: AdminModalProps) {
  const [draftAnnouncement, setDraftAnnouncement] = useState(announcement);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const totalBooks = books.filter((b) => b.mediaType !== 'manga').length;
  const totalMangas = books.filter((b) => b.mediaType === 'manga').length;
  const totalCompleted = books.filter((b) => b.status === 'completed').length;

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAnnouncement(draftAnnouncement.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden my-8 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header com estilo dourado e morango */}
        <div className="px-6 py-5 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
              <Crown className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100">
                  Painel do Criador &bull; ADM
                </h3>
                <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  Manhã de Morango 🍓
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Acesso com privilégios de administrador: <strong className="text-amber-600 dark:text-amber-400">{userEmail}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Card de Estatísticas do Criador */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Resumo da Sua Biblioteca
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl text-center">
                <span className="text-xl font-bold font-serif text-amber-600 dark:text-amber-400">
                  {totalBooks}
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Livros</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl text-center">
                <span className="text-xl font-bold font-serif text-rose-600 dark:text-rose-400">
                  {totalMangas}
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Mangás</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl text-center">
                <span className="text-xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
                  {totalCompleted}
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Concluídos</p>
              </div>
            </div>
          </div>

          {/* Status do Servidor & Segurança */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-500" /> Infraestrutura &amp; Nuvem
            </h4>
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-sky-500" /> Banco de Dados
                </span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Conectado (Supabase)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  🇧🇷 Região do Servidor
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  São Paulo (sa-east-1)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Segurança
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Row Level Security (RLS) Ativo
                </span>
              </div>
            </div>
          </div>

          {/* Banner de Aviso do Criador */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-rose-500" /> Aviso do Criador (Banner no Topo)
            </h4>
            <form onSubmit={handleSaveNotice} className="space-y-2">
              <input
                type="text"
                placeholder="Ex: 🍓 Sejam bem-vindos ao Le Loisir! Aproveitem suas leituras."
                value={draftAnnouncement}
                onChange={(e) => setDraftAnnouncement(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">
                  Deixe em branco para desativar o banner.
                </span>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" /> Salvo!
                    </>
                  ) : (
                    'Atualizar Aviso'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Links Rápidos de Administração */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Acessos Rápidos do Desenvolvedor
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="https://supabase.com/dashboard/project/jyheesofjgppxmuxgbcz"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" /> Painel Supabase SP
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </a>

              <a
                href="https://github.com/StrawberryMorning/misericordia-book-guide"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 fill-current text-zinc-800 dark:text-zinc-200" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Repositório GitHub
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
