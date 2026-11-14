export type BookStatus = 'want_to_read' | 'reading' | 'completed' | 'abandoned';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  rating: number; // 0 to 5
  coverUrl?: string;
  notes?: string;
  favoriteQuote?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SortOption = 'recent' | 'rating' | 'progress' | 'title' | 'pages';
