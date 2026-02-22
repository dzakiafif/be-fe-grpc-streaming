'use client';

import { useState } from 'react';
import { useBooks } from '@/store/bookStore';
import { useConnectionError, useIsConnected } from '@/store/connectionStore';
import { useBookStream } from '@/hooks/useBookStream';
import { useCreateBook, useUpdateBook, useDeleteBook, useSearchBooks } from '@/hooks/useBookMutations';
import { BookCard } from '@/components/BookCard';
import { BookForm } from '@/components/BookForm';
import { SearchBar } from '@/components/SearchBar';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Book, BookFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Loader2 } from 'lucide-react';

function BookList({ 
  books, 
  onEdit, 
  onDelete 
}: { 
  books: Book[]; 
  onEdit: (book: Book) => void; 
  onDelete: (id: string) => void;
}) {
  if (books.length === 0) {
    return (
      <div className="text-center py-20 border rounded-lg bg-muted/50">
        <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-1">No books found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search or add a new book
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-20 border rounded-lg bg-muted/50">
      <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-1">No books yet</h3>
      <p className="text-muted-foreground mb-4">
        Get started by adding your first book
      </p>
      <Button onClick={onAdd} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Book
      </Button>
    </div>
  );
}

export default function Home() {
  useBookStream();
  
  const books = useBooks();
  const isConnected = useIsConnected();
  const error = useConnectionError();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();
  const searchBooks = useSearchBooks();

  const isLoading = !isConnected && books.length === 0;

  const handleAddClick = () => {
    setEditingBook(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (book: Book) => {
    setEditingBook(book);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      deleteBook.mutate(id);
    }
  };

  const handleFormSubmit = (data: BookFormData) => {
    if (editingBook) {
      updateBook.mutate({ id: editingBook.id, book: data });
    } else {
      createBook.mutate(data);
    }
  };

  const handleSearch = (query: string) => {
    searchBooks.mutate(query);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Book Manager</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time book management with gRPC streaming
                </p>
              </div>
            </div>
            <ConnectionStatus />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <SearchBar onSearch={handleSearch} />
          </div>
          <Button onClick={handleAddClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Book
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading books...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {books.length === 0
                  ? 'No books found'
                  : `Showing ${books.length} book${books.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {books.length === 0 ? (
              <EmptyState onAdd={handleAddClick} />
            ) : (
              <BookList 
                books={books} 
                onEdit={handleEditClick} 
                onDelete={handleDeleteClick} 
              />
            )}
          </>
        )}
      </div>

      <BookForm
        book={editingBook}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
      />
    </main>
  );
}
