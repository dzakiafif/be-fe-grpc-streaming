import { VALIDATION } from '../constants';
import { BookInput } from '../types/book';

export function validateBookInput(data: unknown, requireAll = true): BookInput | null {
  if (typeof data !== 'object' || data === null) return null;
  
  const d = data as Record<string, unknown>;
  const result: BookInput = {};
  
  if (d.title !== undefined) {
    const title = typeof d.title === 'string' ? d.title.trim() : '';
    if (title.length === 0 || title.length > VALIDATION.TITLE_MAX_LENGTH) return null;
    result.title = title;
  } else if (requireAll) {
    return null;
  }
  
  if (d.author !== undefined) {
    const author = typeof d.author === 'string' ? d.author.trim() : '';
    if (author.length === 0 || author.length > VALIDATION.AUTHOR_MAX_LENGTH) return null;
    result.author = author;
  } else if (requireAll) {
    return null;
  }
  
  if (d.description !== undefined) {
    const description = typeof d.description === 'string' ? d.description.trim() : '';
    if (description.length > VALIDATION.DESCRIPTION_MAX_LENGTH) return null;
    result.description = description;
  }
  
  if (d.published_year !== undefined || d.publishedYear !== undefined) {
    const publishedYear = typeof d.published_year === 'number' 
      ? d.published_year 
      : (typeof d.publishedYear === 'number' ? d.publishedYear : new Date().getFullYear());
    const maxYear = new Date().getFullYear() + VALIDATION.MAX_PUBLISHED_YEAR_OFFSET;
    if (publishedYear < VALIDATION.MIN_PUBLISHED_YEAR || publishedYear > maxYear) return null;
    result.publishedYear = publishedYear;
  }
  
  return result;
}

export function isValidBookId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  if (id.length === 0) return false;
  return true;
}

export function sanitizeSearchQuery(query: string): string {
  return query.replace(/[%_]/g, '\\$&');
}
