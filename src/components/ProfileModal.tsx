'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  currentName: string;
  onUpdateName: (newName: string) => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  userEmail,
  currentName,
  onUpdateName,
}: ProfileModalProps) {
  const [nameInput, setNameInput] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setNameInput(currentName);
    setMessage(null);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = getSupabaseClient();
    if (!client) return;

    setLoading(true);
    setMessage(null);

    try {
      const finalName = nameInput.trim() || userEmail.split('@')[0];
      const { error } = await client.auth.updateUser({
        data: {
          display_name: finalName,
        },
      });

      if (error) throw error;

      onUpdateName(finalName);
      setMessage({ text: 'Nome de exibição atualizado com sucesso!', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar perfil.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
                Editar Perfil
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Personalize seu nome na estante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3.5">
            {/* Email (Read only) */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Seu Email (Identificador Único)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled
                  value={userEmail}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            {/* Display Name Input */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                <span>Nome de Exibição</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3" /> Livre
                </span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={30}
                  placeholder="Seu nome ou apelido"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Outros leitores podem ter nomes iguais; o que garante a sua conta é o seu e-mail.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
