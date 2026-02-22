import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import { Book, ActionType, StreamHandler, BookResponse } from './types';
import { TIMEOUTS, GRPC } from './constants';

export type { BookResponse };

const PROTO_PATH = join(process.cwd(), GRPC.PROTO_PATH);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
  book: {
    BookService: new (
      address: string,
      credentials: grpc.ChannelCredentials
    ) => grpc.Client & {
      streamBooks(): grpc.ClientDuplexStream<unknown, unknown>;
    };
  };
};



function createBookClient() {
  return new proto.book.BookService(
    GRPC.BACKEND_HOST,
    grpc.credentials.createInsecure()
  );
}



class GrpcBookClient {
  private client: ReturnType<typeof createBookClient>;
  private stream: grpc.ClientDuplexStream<unknown, unknown> | null = null;
  private handlers: Set<StreamHandler> = new Set();
  private errorHandlers: Set<(error: Error) => void> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private pendingRequests: Array<Record<string, unknown>> = [];
  private isStreamReady = false;

  constructor() {
    this.client = createBookClient();
  }

  onError(handler: (error: Error) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  private notifyError(error: Error): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch {
        // Ignore
      }
    });
  }

  connect(): void {
    if (this.stream) return;

    this.isStreamReady = false;
    this.stream = this.client.streamBooks();

    this.stream.on('data', (response: Record<string, unknown>) => {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      if (!this.isStreamReady) {
        this.isStreamReady = true;
        while (this.pendingRequests.length > 0) {
          const req = this.pendingRequests.shift();
          if (req) {
            this.stream?.write(req);
          }
        }
      }
      
      const data: BookResponse = {
        action: String(response.action),
        status: String(response.status),
        message: String(response.message),
        requestId: String(response.request_id),
        books: Array.isArray(response.books) 
          ? response.books.map(this.mapBookFromProto)
          : undefined,
        book: response.book 
          ? this.mapBookFromProto(response.book as Record<string, unknown>)
          : undefined,
        totalCount: typeof response.total_count === 'number' 
          ? response.total_count 
          : undefined,
        timestamp: String(response.timestamp),
      };

      this.handlers.forEach((handler) => {
        try {
          handler(data);
        } catch {
          // Ignore
        }
      });
    });

    this.stream.on('error', (error: Error) => {
      this.isStreamReady = false;
      this.notifyError(error);
      this.scheduleReconnect();
    });

    this.stream.on('end', () => {
      this.isStreamReady = false;
      this.scheduleReconnect();
    });

    this.send({ action: ActionType.SUBSCRIBE, requestId: 'init' });

    setImmediate(() => {
      if (!this.isStreamReady) {
        this.isStreamReady = true;
        while (this.pendingRequests.length > 0) {
          const req = this.pendingRequests.shift();
          if (req) {
            this.stream?.write(req);
          }
        }
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.stream = null;
      this.isStreamReady = false;
      this.pendingRequests = [];
      this.connect();
    }, TIMEOUTS.RECONNECT_DELAY_MS);
  }

  send(request: {
    action: ActionType;
    requestId: string;
    bookId?: string;
    book?: Partial<Book>;
    searchQuery?: string;
  }): void {
    if (!this.stream) {
      this.connect();
    }

    const protoRequest: Record<string, unknown> = {
      action: ActionType[request.action],
      request_id: request.requestId,
    };

    if (request.bookId) protoRequest.book_id = request.bookId;
    if (request.searchQuery) protoRequest.search_query = request.searchQuery;
    if (request.book) {
      protoRequest.book = {
        id: request.book.id || '',
        title: request.book.title || '',
        author: request.book.author || '',
        description: request.book.description || '',
        published_year: request.book.publishedYear || 0,
      };
    }

    if (!this.isStreamReady && this.stream) {
      this.pendingRequests.push(protoRequest);
      return;
    }

    this.stream?.write(protoRequest);
  }

  subscribe(handler: StreamHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  listBooks(searchQuery?: string): void {
    this.send({
      action: ActionType.LIST,
      requestId: `list-${Date.now()}`,
      searchQuery,
    });
  }

  getBook(id: string): void {
    this.send({
      action: ActionType.GET,
      requestId: `get-${Date.now()}`,
      bookId: id,
    });
  }

  createBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.send({
      action: ActionType.CREATE,
      requestId: `create-${Date.now()}`,
      book,
    });
  }

  updateBook(id: string, book: Partial<Omit<Book, 'id' | 'createdAt'>>): void {
    this.send({
      action: ActionType.UPDATE,
      requestId: `update-${Date.now()}`,
      bookId: id,
      book,
    });
  }

  deleteBook(id: string): void {
    this.send({
      action: ActionType.DELETE,
      requestId: `delete-${Date.now()}`,
      bookId: id,
    });
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
    this.isStreamReady = false;
    this.pendingRequests = [];
  }

  private mapBookFromProto(protoBook: Record<string, unknown>): Book {
    return {
      id: String(protoBook.id),
      title: String(protoBook.title),
      author: String(protoBook.author),
      description: String(protoBook.description),
      publishedYear: Number(protoBook.published_year) || 0,
      createdAt: String(protoBook.created_at),
      updatedAt: String(protoBook.updated_at),
    };
  }
}

let grpcClient: GrpcBookClient | null = null;

export function getGrpcClient(): GrpcBookClient {
  if (!grpcClient) {
    grpcClient = new GrpcBookClient();
  }
  return grpcClient;
}

export function resetGrpcClient(): void {
  if (grpcClient) {
    grpcClient.disconnect();
    grpcClient = null;
  }
}
