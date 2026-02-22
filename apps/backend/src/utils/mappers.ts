import { Book, ProtoBook } from '../types/book';

export function bookToProto(book: Book): ProtoBook {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    published_year: book.publishedYear,
    created_at: book.createdAt,
    updated_at: book.updatedAt,
  };
}

export function mapFromDatabase(record: Record<string, unknown>): Book {
  return {
    id: String(record.id),
    title: String(record.title),
    author: String(record.author),
    description: String(record.description || ''),
    publishedYear: Number(record.published_year) || 0,
    createdAt: String(record.created_at),
    updatedAt: String(record.updated_at),
  };
}
