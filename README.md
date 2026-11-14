# 📚 Misericórdia Books - Registro e Diário de Leitura

Uma aplicação web moderna, minimalista e elegante para rastreamento de leitura, acompanhamento de hábitos e registro de citações.

Projetada com foco em experiência do usuário (UX), persistência local imediata e pronta para escalabilidade multiplataforma (Web e Mobile com Flutter).

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-black?style=for-the-badge&logo=vercel)
[![Live Demo](https://img.shields.io/badge/Demo-Online%20no%20Vercel-success?style=for-the-badge)](https://misericordia-book-guide.vercel.app)

---

## ✨ Funcionalidades

- **CRUD Completo de Livros e Mangás:** Cadastro de título, autor(a)/mangaká, gênero, total de páginas/capítulos, unidade de medida, nota de 1 a 5 estrelas, frase marcante e anotações/resenhas.
- **Auto-preenchimento Duplo (Google Books + Jikan API):** 
  - 📚 **Livros:** Busca rápida na Google Books API com capa, autor e páginas.
  - ⛩️ **Mangás & HQs:** Busca em tempo real na **Jikan API (MyAnimeList)** trazendo títulos oficiais, mangakás, total de capítulos e nota da comunidade mundial.
- **Painel de Estatísticas de Leitura:**
  - Total de livros lidos e em andamento.
  - Total de páginas consumidas.
  - Fila de desejos ("Quero Ler").
  - Média geral de avaliações.
- **Barra de Progresso Interativa:**
  - Atualização rápida de páginas (+10 páginas ou "Terminei").
  - Efeito de celebração com confetes ao concluir a leitura.
- **Filtros e Busca em Tempo Real:**
  - Filtro por abas de status (*Lendo*, *Quero Ler*, *Concluídos*, *Abandonados*).
  - Busca instantânea por título, autor ou gênero.
  - Ordenação dinâmica por mais recentes, avaliação, progresso em % e páginas.
- **Backup Seguro (Import / Export JSON):** Seus dados são salvos no `localStorage` do navegador e você pode exportar ou restaurar o arquivo JSON de backup a qualquer momento.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Efeitos Visuais:** Canvas Confetti
- **Deploy:** [Vercel](https://vercel.com/)

---

## 🚀 Como Executar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/StrawberryMorning/misericordia_book_guide.git
cd misericordia_book_guide
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra no navegador: [http://localhost:3000](http://localhost:3000)

---

## 🗺️ Roadmap de Evolução

- [x] **Fase 1 (MVP Web):** Interface fluida, CRUD local, Google Books API e Vercel Deploy.
- [ ] **Fase 2 (Backend & Nuvem):** Banco de dados relacional (PostgreSQL via Supabase/Neon) e autenticação de usuários.
- [ ] **Fase 3 (App Mobile com Flutter):** Criação do aplicativo móvel nativo em Flutter consumindo as mesmas rotas e sincronizando a biblioteca em tempo real.
- [ ] **Fase 4 (Scanner de Código de Barras):** Leitura de ISBN direto pela câmera do celular.

---

Desenvolvido com carinho por **StrawberryMorning**.
