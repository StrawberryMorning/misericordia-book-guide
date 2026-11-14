import { Book } from '@/types/book';

const STORAGE_KEY = 'misericordia_reading_tracker_books_v1';

export const INITIAL_BOOKS: Book[] = [
  {
    id: 'sample-1',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    genre: 'Clássico Brasileiro',
    totalPages: 256,
    currentPage: 256,
    status: 'completed',
    rating: 5,
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
    notes: 'A questão de Capitu e os olhos de ressaca continua fascinante. Uma aula de psicologia e ironia.',
    favoriteQuote: 'Olhos de ressaca? Vá, de ressaca. É o que me dá idéia daquela feição nova.',
    startedAt: '2026-01-10',
    finishedAt: '2026-01-28',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    title: '1984',
    author: 'George Orwell',
    genre: 'Ficção Distópica',
    totalPages: 336,
    currentPage: 210,
    status: 'reading',
    rating: 5,
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    notes: 'A reflexão sobre a Novilíngua e a vigilância permanente é extremamente atual.',
    favoriteQuote: 'Guerra é Paz. Liberdade é Escravidão. Ignorância é Força.',
    startedAt: '2026-02-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    title: 'O Pequeno Príncipe',
    author: 'Antoine de Saint-Exupéry',
    genre: 'Fábula Filosófica',
    totalPages: 96,
    currentPage: 0,
    status: 'want_to_read',
    rating: 0,
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
    notes: 'Quero reler com a maturidade de hoje.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getStoredBooks(): Book[] {
  if (typeof window === 'undefined') return INITIAL_BOOKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKS));
      return INITIAL_BOOKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_BOOKS;
  } catch (err) {
    console.error('Erro ao ler livros do localStorage:', err);
    return INITIAL_BOOKS;
  }
}

export function saveStoredBooks(books: Book[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (err) {
    console.error('Erro ao salvar livros no localStorage:', err);
  }
}

export function exportBooksAsJSON(books: Book[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(books, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `meus-livros-backup-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
