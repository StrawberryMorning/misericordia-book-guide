export type BookStatus = 'want_to_read' | 'reading' | 'completed' | 'abandoned';
export type MediaType = 'book' | 'manga';
export type UnitType = 'pages' | 'chapters' | 'volumes';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  totalPages: number; // can represent total units (pages, chapters, or volumes)
  currentPage: number;
  status: BookStatus;
  rating: number; // 0 to 5
  mediaType?: MediaType;
  unitType?: UnitType;
  coverUrl?: string;
  notes?: string;
  favoriteQuote?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SortOption = 'recent' | 'rating' | 'progress' | 'title' | 'pages';
