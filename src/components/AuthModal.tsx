'use client';

import React, { useState } from 'react';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  saveManualSupabaseCredentials,
  clearManualSupabaseCredentials,
} from '@/lib/supabaseClient';
import {
  X,
  Cloud,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  KeyRound,
  Settings,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Manual key connection state
  const [showManualKeyInputs, setShowManualKeyInputs] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [configuredState, setConfiguredState] = useState(isSupabaseConfigured());

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = getSupabaseClient();
    if (!client) {
      setMessage({ text: 'Supabase não inicializado. Verifique as credenciais.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage({ text: 'Login realizado com sucesso! Sincronizando estante...', type: 'success' });
        setTimeout(() => {
          onAuthSuccess();
          onClose();
        }, 1200);
      } else {
        const { error } = await client.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: 'Conta criada! Verifique seu email para confirmar ou faça login.', type: 'success' });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao autenticar.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao autenticar com ' + provider;
      setMessage({ text: errorMsg, type: 'error' });
      setLoading(false);
    }
  };

  const handleSaveManualKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.startsWith('https://') || manualKey.length < 20) {
      setMessage({
        text: 'URL inválida (deve começar com https://) ou Chave Anon curta demais.',
        type: 'error',
      });
      return;
    }

    const success = saveManualSupabaseCredentials(manualUrl, manualKey);
    if (success) {
      setConfiguredState(true);
      setShowManualKeyInputs(false);
      setMessage({ text: 'Chaves conectadas com sucesso! Agora você já pode entrar.', type: 'success' });
    } else {
      setMessage({ text: 'Erro ao salvar credenciais.', type: 'error' });
    }
  };

  const handleResetCredentials = () => {
    if (confirm('Deseja remover as chaves salvas localmente?')) {
      clearManualSupabaseCredentials();
      setConfiguredState(isSupabaseConfigured());
      setMessage(null);
    }
  };

  const sqlCode = `-- Cole no SQL Editor do Supabase (supabase.com):
create table if not exists public.books (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  author text not null,
  genre text default 'Geral',
  total_pages integer default 100,
  current_page integer default 0,
  status text default 'want_to_read',
  rating integer default 0,
  media_type text default 'book',
  unit_type text default 'pages',
  cover_url text,
  notes text,
  favorite_quote text,
  started_at text,
  finished_at text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.books enable row level security;

create policy "Usuários podem ver apenas seus próprios livros"
  on public.books for select using (auth.uid() = user_id);

create policy "Usuários podem inserir livros para si mesmos"
  on public.books for insert with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios livros"
  on public.books for update using (auth.uid() = user_id);

create policy "Usuários podem excluir seus próprios livros"
  on public.books for delete using (auth.uid() = user_id);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
                Sincronização em Nuvem
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Guarde seus livros com segurança no Supabase
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Message notification */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="flex-1">{message.text}</span>
            </div>
          )}

          {configuredState && !showManualKeyInputs ? (
            <>
              {/* Tabs */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  Criar Conta
                </button>
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleAuth} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-900 dark:text-zinc-100 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-900 dark:text-zinc-100 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'Processando...' : mode === 'login' ? 'Entrar na Minha Estante' : 'Criar Minha Conta Gratuita'}
                </button>
              </form>

              {/* OAuth Google */}
              <div className="relative my-3 text-center">
                <span className="bg-white dark:bg-zinc-900 px-2 text-[11px] text-zinc-400 uppercase tracking-wider">
                  Ou continue com
                </span>
                <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-zinc-200 dark:bg-zinc-800" />
              </div>

              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="w-full py-2 px-3 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Entrar com Google
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowManualKeyInputs(true)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center justify-center gap-1 mx-auto"
                >
                  <Settings className="w-3 h-3" /> Gerenciar conexão do Supabase
                </button>
              </div>
            </>
          ) : (
            /* Supabase Setup Helper */
            <div className="space-y-3.5 text-left">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Cloud className="w-4 h-4 text-amber-600" /> Conecte seu Supabase Gratuito
                </p>
                Seus livros ficarão salvos para sempre na sua própria nuvem, acessíveis de qualquer dispositivo!
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Passo 1: Crie o projeto gratuito
                </p>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir Supabase.com
                </a>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Passo 2: Cole o SQL da Tabela (SQL Editor)
                </p>
                <button
                  type="button"
                  onClick={copySql}
                  className="w-full py-1.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium flex items-center justify-between text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  <span className="truncate">Tabela &lsquo;books&rsquo; com RLS</span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'Copiado!' : 'Copiar'}
                  </span>
                </button>
              </div>

              {/* Form to insert keys directly */}
              <form onSubmit={handleSaveManualKeys} className="space-y-2.5 pt-1">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Passo 3: Conecte suas credenciais
                </p>
                <input
                  type="url"
                  required
                  placeholder="Project URL (https://xyz.supabase.co)"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-mono"
                />
                <input
                  type="password"
                  required
                  placeholder="Anon / Public Key (eyJhbGci...)"
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-mono"
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                  >
                    Salvar e Conectar
                  </button>
                  {configuredState && (
                    <button
                      type="button"
                      onClick={() => setShowManualKeyInputs(false)}
                      className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium"
                    >
                      Voltar
                    </button>
                  )}
                </div>
              </form>

              {configuredState && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleResetCredentials}
                    className="text-[11px] text-rose-500 hover:underline"
                  >
                    Desconectar chaves salvas neste navegador
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
