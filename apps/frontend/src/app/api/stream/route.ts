import { NextRequest } from 'next/server';
import { getGrpcClient, BookResponse, resetGrpcClient } from '@/lib/grpc-client';

export const dynamic = 'force-dynamic';

const SSE_RETRY_MS = 3000;

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const client = getGrpcClient();
      let isClosed = false;

      const closeConnection = () => {
        if (isClosed) return;
        isClosed = true;
        unsubscribe();
        try {
          controller.close();
        } catch {
          //
        }
      };

      const unsubscribe = client.subscribe((response: BookResponse) => {
        if (isClosed) return;
        
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(response)}\n\n`)
          );
        } catch {
          closeConnection();
        }
      });

      const unsubscribeError = client.onError(() => {
        closeConnection();
      });

      try {
        client.connect();
      } catch {
        //
      }

      request.signal.addEventListener('abort', () => {
        closeConnection();
        unsubscribeError();
        resetGrpcClient();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Retry': SSE_RETRY_MS.toString(),
    },
  });
}

interface ActionRequest {
  action: string;
  bookId?: string;
  book?: Record<string, unknown>;
  searchQuery?: string;
}

export async function POST(request: NextRequest) {
  try {
    let body: ActionRequest;
    
    try {
      body = await request.json() as ActionRequest;
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    const { action, bookId, book, searchQuery } = body;

    const client = getGrpcClient();

    switch (action) {
      case 'LIST':
        client.listBooks(searchQuery);
        break;
      case 'GET':
        if (!bookId) {
          return Response.json({ error: 'Book ID is required' }, { status: 400 });
        }
        client.getBook(bookId);
        break;
      case 'CREATE':
        if (!book || typeof book !== 'object') {
          return Response.json({ error: 'Book data is required' }, { status: 400 });
        }
        client.createBook(book as Parameters<typeof client.createBook>[0]);
        break;
      case 'UPDATE':
        if (!bookId) {
          return Response.json({ error: 'Book ID is required' }, { status: 400 });
        }
        if (!book || typeof book !== 'object') {
          return Response.json({ error: 'Book data is required' }, { status: 400 });
        }
        client.updateBook(bookId, book as Parameters<typeof client.updateBook>[1]);
        break;
      case 'DELETE':
        if (!bookId) {
          return Response.json({ error: 'Book ID is required' }, { status: 400 });
        }
        client.deleteBook(bookId);
        break;
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('UNAVAILABLE') || errorMessage.includes('ECONNREFUSED')) {
      return Response.json(
        { error: 'Backend service unavailable' },
        { status: 503 }
      );
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
