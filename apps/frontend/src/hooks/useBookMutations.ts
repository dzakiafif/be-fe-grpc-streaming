'use client';

import { useMutation } from '@tanstack/react-query';
import { BookFormData } from '@/lib/types';

async function createBook(book: BookFormData) {
  const response = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'CREATE', book }),
  });
  
  if (response.status === 503) {
    throw new Error('Backend service unavailable');
  }
  
  if (!response.ok) {
    throw new Error('Failed to create book');
  }
}

async function updateBook({ id, book }: { id: string; book: Partial<BookFormData> }) {
  const response = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'UPDATE', bookId: id, book }),
  });
  
  if (response.status === 503) {
    throw new Error('Backend service unavailable');
  }
  
  if (!response.ok) {
    throw new Error('Failed to update book');
  }
}

async function deleteBook(id: string) {
  const response = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'DELETE', bookId: id }),
  });
  
  if (response.status === 503) {
    throw new Error('Backend service unavailable');
  }
  
  if (!response.ok) {
    throw new Error('Failed to delete book');
  }
}

async function searchBooks(query: string) {
  const response = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'LIST', searchQuery: query }),
  });
  
  if (response.status === 503) {
    throw new Error('Backend service unavailable');
  }
  
  if (!response.ok) {
    throw new Error('Failed to search books');
  }
}

export function useCreateBook() {
  return useMutation({
    mutationFn: createBook,
  });
}

export function useUpdateBook() {
  return useMutation({
    mutationFn: updateBook,
  });
}

export function useDeleteBook() {
  return useMutation({
    mutationFn: deleteBook,
  });
}

export function useSearchBooks() {
  return useMutation({
    mutationFn: searchBooks,
  });
}
