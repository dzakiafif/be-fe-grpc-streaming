import { Book, ActionType, Status, BookStreamResponse } from '../types/book';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './database';

class BookStore {
  private inMemoryBooks: Map<string, Book> = new Map();
  private listeners: Set<(response: BookStreamResponse) => void> = new Set();
  private useDatabase: boolean;

  constructor() {
    this.useDatabase = databaseService.isAvailable;
    
    if (!this.useDatabase) {
      this.seedData();
    }

    if (this.useDatabase) {
      databaseService.subscribeToChanges((payload) => {
        this.handleRealtimeChange(payload);
      });
    }
  }

  private seedData() {
    const initialBooks: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'A novel about the American dream set in the Jazz Age.',
        publishedYear: 1925,
      },
      {
        title: '1984',
        author: 'George Orwell',
        description: 'A dystopian social science fiction novel.',
        publishedYear: 1949,
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'A novel about racial injustice in the American South.',
        publishedYear: 1960,
      },
    ];

    initialBooks.forEach((book) => {
      const id = uuidv4();
      const now = new Date().toISOString();
      this.inMemoryBooks.set(id, {
        ...book,
        id,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  private handleRealtimeChange(payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Book | null;
    old: Book | null;
  }) {
    const actionMap: Record<string, ActionType> = {
      'INSERT': ActionType.CREATE,
      'UPDATE': ActionType.UPDATE,
      'DELETE': ActionType.DELETE,
    };
    
    const messageMap: Record<string, string> = {
      'INSERT': 'Book created via realtime',
      'UPDATE': 'Book updated via realtime',
      'DELETE': 'Book deleted via realtime',
    };
    
    const action = actionMap[payload.eventType];
    const book = payload.new || payload.old || undefined;

    if (book && action) {
      this.broadcast({
        action,
        status: Status.SUCCESS,
        message: messageMap[payload.eventType],
        requestId: '',
        book,
        timestamp: new Date().toISOString(),
      });
    }
  }

  subscribe(callback: (response: BookStreamResponse) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private broadcast(response: BookStreamResponse) {
    this.listeners.forEach((listener) => {
      try {
        listener(response);
      } catch {
        // Ignore listener errors
      }
    });
  }

  async getAllBooks(searchQuery?: string): Promise<Book[]> {
    if (this.useDatabase) {
      return databaseService.getAllBooks(searchQuery);
    }
    
    let books = Array.from(this.inMemoryBooks.values());
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      books = books.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
    }
    
    return books.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getBook(id: string): Promise<Book | undefined> {
    if (this.useDatabase) {
      const book = await databaseService.getBook(id);
      return book ?? undefined;
    }
    return this.inMemoryBooks.get(id);
  }

  async createBook(
    bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Book> {
    if (this.useDatabase) {
      const book = await databaseService.createBook(bookData);
      return book;
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    
    const book: Book = {
      ...bookData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.inMemoryBooks.set(id, book);
    
    this.broadcast({
      action: ActionType.CREATE,
      status: Status.SUCCESS,
      message: 'Book created successfully',
      requestId: '',
      book,
      totalCount: this.inMemoryBooks.size,
      timestamp: now,
    });
    
    return book;
  }

  async updateBook(
    id: string,
    bookData: Partial<Omit<Book, 'id' | 'createdAt'>>
  ): Promise<Book | null> {
    if (this.useDatabase) {
      return databaseService.updateBook(id, bookData);
    }

    const existingBook = this.inMemoryBooks.get(id);
    
    if (!existingBook) {
      return null;
    }
    
    const updatedBook: Book = {
      ...existingBook,
      ...bookData,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    this.inMemoryBooks.set(id, updatedBook);
    
    this.broadcast({
      action: ActionType.UPDATE,
      status: Status.SUCCESS,
      message: 'Book updated successfully',
      requestId: '',
      book: updatedBook,
      totalCount: this.inMemoryBooks.size,
      timestamp: updatedBook.updatedAt,
    });
    
    return updatedBook;
  }

  async deleteBook(id: string): Promise<boolean> {
    if (this.useDatabase) {
      return databaseService.deleteBook(id);
    }

    const book = this.inMemoryBooks.get(id);
    
    if (!book) {
      return false;
    }
    
    this.inMemoryBooks.delete(id);
    
    this.broadcast({
      action: ActionType.DELETE,
      status: Status.SUCCESS,
      message: 'Book deleted successfully',
      requestId: '',
      book,
      totalCount: this.inMemoryBooks.size,
      timestamp: new Date().toISOString(),
    });
    
    return true;
  }

  async count(): Promise<number> {
    if (this.useDatabase) {
      return databaseService.countBooks();
    }
    return this.inMemoryBooks.size;
  }

  get isUsingDatabase(): boolean {
    return this.useDatabase;
  }
}

export const bookStore = new BookStore();
