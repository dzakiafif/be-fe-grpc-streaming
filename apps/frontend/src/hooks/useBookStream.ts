'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useBookActions } from '@/store/bookStore';
import { useConnectionActions } from '@/store/connectionStore';

const RECONNECT_DELAY_MS = 3000;

interface BookResponse {
  action: string;
  status: string;
  message: string;
  requestId: string;
  books?: Array<{
    id: string;
    title: string;
    author: string;
    description: string;
    published_year: number;
    created_at: string;
    updated_at: string;
  }>;
  book?: {
    id: string;
    title: string;
    author: string;
    description: string;
    published_year: number;
    created_at: string;
    updated_at: string;
  };
  totalCount?: number;
  timestamp: string;
}

function mapBookFromProto(protoBook: NonNullable<BookResponse['book']>) {
  return {
    id: protoBook.id,
    title: protoBook.title,
    author: protoBook.author,
    description: protoBook.description,
    publishedYear: protoBook.published_year,
    createdAt: protoBook.created_at,
    updatedAt: protoBook.updated_at,
  };
}

export function useBookStream() {
  const { setBooks, addBook, updateBook, removeBook } = useBookActions();
  const { setConnected, setError } = useConnectionActions();
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasReceivedDataRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    clearTimers();
    hasReceivedDataRef.current = false;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const eventSource = new EventSource('/api/stream');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as BookResponse;

        if (!hasReceivedDataRef.current) {
          hasReceivedDataRef.current = true;
          setConnected(true);
          setError(null);
        }

        switch (data.action) {
          case 'LIST':
          case 'SUBSCRIBE':
            if (data.books) {
              setBooks(data.books.map(mapBookFromProto));
            }
            break;

          case 'CREATE':
            if (data.book && data.status === 'SUCCESS') {
              addBook(mapBookFromProto(data.book));
            }
            break;

          case 'UPDATE':
            if (data.book && data.status === 'SUCCESS') {
              updateBook(mapBookFromProto(data.book));
            }
            break;

          case 'DELETE':
            if (data.status === 'SUCCESS' && data.book) {
              removeBook(data.book.id);
            }
            break;
        }
      } catch {
        // Silently fail for parse errors
      }
    };

    eventSource.onerror = () => {
      clearTimers();
      eventSource.close();
      eventSourceRef.current = null;
      setConnected(false);
      setError('Connection lost. Reconnecting...');
      
      reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  }, [setBooks, addBook, updateBook, removeBook, setConnected, setError, clearTimers]);

  useEffect(() => {
    connect();

    return () => {
      clearTimers();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect, clearTimers]);
}
