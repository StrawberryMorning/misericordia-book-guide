-- ==============================================================================
-- Le Loisir - Supabase Schema
-- Cole este script no SQL Editor do seu projeto Supabase (supabase.com)
-- ==============================================================================

-- 1. Cria a tabela de livros vinculada aos usuários autenticados
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

-- 2. Habilita Row Level Security (RLS) - Garante privacidade absoluta
alter table public.books enable row level security;

-- 3. Políticas de Acesso: Cada usuário só enxerga e manipula seus próprios livros
create policy "Usuários podem ver apenas seus próprios livros"
  on public.books for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir livros para si mesmos"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios livros"
  on public.books for update
  using (auth.uid() = user_id);

create policy "Usuários podem excluir seus próprios livros"
  on public.books for delete
  using (auth.uid() = user_id);
