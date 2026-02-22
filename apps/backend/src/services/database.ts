import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Book } from '../types/book';
import { mapFromDatabase, sanitizeSearchQuery } from '../utils';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const useServiceKey = supabaseServiceKey.length > 0;

class DatabaseService {
  private client: SupabaseClient | null = null;

  constructor() {
    if (supabaseUrl && (supabaseKey || supabaseServiceKey)) {
      this.client = createClient(
        supabaseUrl,
        useServiceKey ? supabaseServiceKey : supabaseKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );
    }
  }

  get isAvailable(): boolean {
    return this.client !== null;
  }

  async getAllBooks(searchQuery?: string): Promise<Book[]> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    let query = this.client
      .from('books')
      .select('*')
      .order('updated_at', { ascending: false });

    if (searchQuery) {
      const sanitizedQuery = sanitizeSearchQuery(searchQuery);
      query = query.or(`title.ilike.%${sanitizedQuery}%,author.ilike.%${sanitizedQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map(mapFromDatabase);
  }

  async getBook(id: string): Promise<Book | null> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.client
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? mapFromDatabase(data) : null;
  }

  async createBook(
    bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Book> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const dbData = {
      title: bookData.title.trim(),
      author: bookData.author.trim(),
      description: bookData.description?.trim() || '',
      published_year: bookData.publishedYear,
    };

    const { data, error } = await this.client
      .from('books')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapFromDatabase(data);
  }

  async updateBook(
    id: string,
    bookData: Partial<Omit<Book, 'id' | 'createdAt'>>
  ): Promise<Book | null> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const dbData: Record<string, unknown> = {};
    if (bookData.title !== undefined) dbData.title = bookData.title.trim();
    if (bookData.author !== undefined) dbData.author = bookData.author.trim();
    if (bookData.description !== undefined) dbData.description = bookData.description.trim();
    if (bookData.publishedYear !== undefined) dbData.published_year = bookData.publishedYear;

    const { data, error } = await this.client
      .from('books')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? mapFromDatabase(data) : null;
  }

  async deleteBook(id: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const { error } = await this.client.from('books').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  async countBooks(): Promise<number> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const { count, error } = await this.client
      .from('books')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return count || 0;
  }

  subscribeToChanges(
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: Book | null;
      old: Book | null;
    }) => void
  ): () => void {
    if (!this.client) {
      return () => {};
    }

    const subscription = this.client
      .channel('books_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books',
        },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new ? mapFromDatabase(payload.new as Record<string, unknown>) : null,
            old: payload.old ? mapFromDatabase(payload.old as Record<string, unknown>) : null,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const databaseService = new DatabaseService();
