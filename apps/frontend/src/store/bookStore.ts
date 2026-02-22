import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Book } from '@/lib/types';

interface BookState {
  books: Book[];
  searchQuery: string;
  actions: {
    setBooks: (books: Book[]) => void;
    addBook: (book: Book) => void;
    updateBook: (book: Book) => void;
    removeBook: (id: string) => void;
    setSearchQuery: (query: string) => void;
  };
}

export const useBookStore = create<BookState>()(
  immer((set) => ({
    books: [],
    searchQuery: '',
    actions: {
      setBooks: (books) => set((state) => {
        state.books = books;
      }),
      addBook: (book) => set((state) => {
        const exists = state.books.find((b) => b.id === book.id);
        if (exists) {
          state.books = state.books.map((b) => (b.id === book.id ? book : b));
        } else {
          state.books.unshift(book);
        }
      }),
      updateBook: (book) => set((state) => {
        const index = state.books.findIndex((b) => b.id === book.id);
        if (index !== -1) {
          state.books[index] = book;
        }
      }),
      removeBook: (id) => set((state) => {
        state.books = state.books.filter((b) => b.id !== id);
      }),
      setSearchQuery: (query) => set((state) => {
        state.searchQuery = query;
      }),
    },
  }))
);

export const useBookActions = () => useBookStore((state) => state.actions);
export const useBooks = () => useBookStore((state) => state.books);
export const useSearchQuery = () => useBookStore((state) => state.searchQuery);
