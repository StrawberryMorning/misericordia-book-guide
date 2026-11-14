'use client';

import React, { useState, useEffect } from 'react';
import {
  Crown,
  X,
  Activity,
  Server,
  Database,
  ExternalLink,
  MessageSquare,
  Check,
  Minimize2,
  RefreshCw,
  Layers,
  Zap,
} from 'lucide-react';
import { Book } from '@/types/book';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface AdminFloatingCockpitProps {
  isAdmin: boolean;
  userEmail?: string | null;
  books: Book[];
  announcement: string;
  onSaveAnnouncement: (msg: string) => void;
}

export default function AdminFloatingCockpit({
  isAdmin,
  userEmail,
  books,
  announcement,
  onSaveAnnouncement,
}: AdminFloatingCockpitProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [draftNotice, setDraftNotice] = useState(announcement);
  const [savedNoticeSuccess, setSavedNoticeSuccess] = useState(false);

  // Synchronize draft notice with props
  useEffect(() => {
    setDraftNotice(announcement);
  }, [announcement]);

  // Ping Supabase SP server to measure real latency
  const measurePing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('books').select('id').limit(1);
        const elapsed = Math.round(performance.now() - start);
        setPingMs(elapsed);
      } else {
        setPingMs(null);
      }
    } catch {
      setPingMs(null);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    if (isAdmin && isOpen) {
      measurePing();
      const interval = setInterval(measurePing, 15000); // refresh every 15s when open
      return () => clearInterval(interval);
    }
  }, [isAdmin, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isAdmin) return null;

  const totalBooks = books.filter((b) => b.mediaType !== 'manga').length;
  const totalMangas = books.filter((b) => b.mediaType === 'manga').length;
  const totalCompleted = books.filter((b) => b.status === 'completed').length;
  const totalReading = books.filter((b) => b.status === 'reading').length;
  const completionRate = books.length > 0 ? Math.round((totalCompleted / books.length) * 100) : 0;

  const handleUpdateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAnnouncement(draftNotice.trim());
    setSavedNoticeSuccess(true);
    setTimeout(() => setSavedNoticeSuccess(false), 2000);
  };

  return (
    <>
      {/* 1. Botão Flutuante (quando fechado) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => setIsOpen(true)}
            title="Abrir Cockpit de ADM & Fluxo"
            className="group flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 hover:from-amber-700 hover:to-rose-700 text-white rounded-2xl shadow-xl shadow-rose-600/25 hover:shadow-2xl hover:scale-105 border border-amber-300/30 transition-all font-semibold text-xs backdrop-blur-md"
          >
            <Crown className="w-4 h-4 text-amber-200 animate-pulse group-hover:rotate-12 transition-transform" />
            <span className="font-medium tracking-wide">Cockpit ADM</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>
        </div>
      )}

      {/* 2. Gaveta / Painel Flutuante Aberto */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-full max-w-sm sm:max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-amber-500/30 dark:border-amber-400/30 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-300 text-zinc-900 dark:text-zinc-100 max-h-[85vh]">
          {/* Header do Cockpit */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-serif font-bold text-sm">Cockpit do Criador</h4>
                  <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                    ADM 🍓
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[190px]">
                  {userEmail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                title="Minimizar Cockpit"
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Fechar"
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conteúdo do Painel Flutuante */}
          <div className="p-4 space-y-4 overflow-y-auto text-xs">
            {/* Monitor de Servidor & Latência */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">São Paulo (sa-east-1)</span>
                    <span className="text-[10px]">🇧🇷</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">Supabase Cloud Database</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{pingMs !== null ? `${pingMs}ms` : 'medindo...'}</span>
                  </div>
                  <span className="text-[9px] text-zinc-400">latência real</span>
                </div>
                <button
                  onClick={measurePing}
                  disabled={isPinging}
                  title="Atualizar teste de ping"
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-transform active:rotate-180"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Métricas de Obras & Leituras */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-rose-500" /> Fluxo da Biblioteca
                </span>
                <span className="text-[10px] text-zinc-400">
                  {books.length} obras totais
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/50">
                  <span className="text-sm font-serif font-bold text-amber-600 dark:text-amber-400">
                    {totalBooks}
                  </span>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Livros</p>
                </div>
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/50">
                  <span className="text-sm font-serif font-bold text-rose-600 dark:text-rose-400">
                    {totalMangas}
                  </span>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Mangás</p>
                </div>
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/50">
                  <span className="text-sm font-serif font-bold text-sky-600 dark:text-sky-400">
                    {totalReading}
                  </span>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Lendo</p>
                </div>
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/50">
                  <span className="text-sm font-serif font-bold text-emerald-600 dark:text-emerald-400">
                    {completionRate}%
                  </span>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Conclusão</p>
                </div>
              </div>
            </div>

            {/* Comunicado Global Rápido */}
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl">
              <label className="font-bold text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                Aviso do Criador no Topo
              </label>
              <form onSubmit={handleUpdateNotice} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Mensagem para os leitores..."
                  value={draftNotice}
                  onChange={(e) => setDraftNotice(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                >
                  {savedNoticeSuccess ? <Check className="w-3.5 h-3.5" /> : 'Salvar'}
                </button>
              </form>
            </div>

            {/* Atalhos do Desenvolvedor */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-200/60 dark:border-zinc-800">
              <a
                href="https://supabase.com/dashboard/project/jyheesofjgppxmuxgbcz"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                <Database className="w-3 h-3" /> Supabase SP <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href="https://github.com/StrawberryMorning/misericordia-book-guide"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Layers className="w-3 h-3" /> GitHub Repo <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="font-mono text-[10px] text-zinc-400">v1.5.0</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
