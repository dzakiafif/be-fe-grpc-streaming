import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import { existsSync } from 'fs';
import { bookStore } from './bookStore';
import { ActionType, Status } from '../types/book';
import { bookToProto, validateBookInput, isValidBookId } from '../utils';

function resolveProtoPath(): string {
  const possiblePaths = [
    join(__dirname, '../proto/book.proto'),
    join(__dirname, '../../src/proto/book.proto'),
    join(process.cwd(), 'apps/backend/src/proto/book.proto'),
    join(process.cwd(), 'src/proto/book.proto'),
  ];
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }
  
  throw new Error('Could not find book.proto file. Searched paths: ' + possiblePaths.join(', '));
}

const PROTO_PATH = resolveProtoPath();
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
  book: {
    BookService: {
      service: grpc.ServiceDefinition;
    };
  };
};

interface ResponsePayload {
  action: string;
  status: string;
  message: string;
  request_id: string;
  books?: ReturnType<typeof bookToProto>[];
  book?: ReturnType<typeof bookToProto>;
  total_count?: number;
  timestamp: string;
}

function createResponse(
  action: string,
  status: Status,
  message: string,
  requestId: string,
  options: {
    books?: ReturnType<typeof bookToProto>[];
    book?: ReturnType<typeof bookToProto>;
    totalCount?: number;
  } = {}
): ResponsePayload {
  return {
    action,
    status: Status[status],
    message,
    request_id: requestId,
    ...(options.books && { books: options.books }),
    ...(options.book && { book: options.book }),
    ...(options.totalCount !== undefined && { total_count: options.totalCount }),
    timestamp: new Date().toISOString(),
  };
}

export const bookService = {
  streamBooks: (call: grpc.ServerDuplexStream<unknown, unknown>) => {
    let isStreamActive = true;

    const unsubscribe = bookStore.subscribe((response) => {
      if (!isStreamActive) return;
      
      try {
        call.write({
          action: ActionType[response.action],
          status: Status[response.status],
          message: response.message,
          request_id: response.requestId,
          book: response.book ? bookToProto(response.book) : undefined,
          books: response.books ? response.books.map(bookToProto) : undefined,
          total_count: response.totalCount,
          timestamp: response.timestamp,
        });
      } catch {
        isStreamActive = false;
      }
    });

    call.on('data', async (request: unknown) => {
      if (!isStreamActive) return;

      const req = request as Record<string, unknown>;
      const actionStr = typeof req.action === 'string' ? req.action : 'UNKNOWN';
      const action = ActionType[actionStr as keyof typeof ActionType] || ActionType.UNKNOWN;
      const requestId = typeof req.request_id === 'string' ? req.request_id : '';

      try {
        switch (action) {
          case ActionType.LIST: {
            const searchQuery = typeof req.search_query === 'string' ? req.search_query : undefined;
            const books = await bookStore.getAllBooks(searchQuery);
            call.write(createResponse('LIST', Status.SUCCESS, `Retrieved ${books.length} books`, requestId, {
              books: books.map(bookToProto),
              totalCount: books.length,
            }));
            break;
          }

          case ActionType.GET: {
            const bookId = req.book_id;
            if (!isValidBookId(bookId)) {
              call.write(createResponse('GET', Status.INVALID_INPUT, 'Invalid book ID', requestId));
              break;
            }
            
            const book = await bookStore.getBook(bookId);
            if (book) {
              call.write(createResponse('GET', Status.SUCCESS, 'Book retrieved successfully', requestId, {
                book: bookToProto(book),
              }));
            } else {
              call.write(createResponse('GET', Status.NOT_FOUND, 'Book not found', requestId));
            }
            break;
          }

          case ActionType.CREATE: {
            const validatedData = validateBookInput(req.book, true);
            
            if (!validatedData || !validatedData.title || !validatedData.author) {
              call.write(createResponse('CREATE', Status.INVALID_INPUT, 
                'Invalid book data. Title and author are required (max 200 and 100 chars).', requestId));
              break;
            }
            
            const newBook = await bookStore.createBook(validatedData as { title: string; author: string; description: string; publishedYear: number });
            const totalCount = await bookStore.count();
            
            call.write(createResponse('CREATE', Status.SUCCESS, 'Book created successfully', requestId, {
              book: bookToProto(newBook),
              totalCount,
            }));
            break;
          }

          case ActionType.UPDATE: {
            const bookId = req.book_id;
            
            if (!isValidBookId(bookId)) {
              call.write(createResponse('UPDATE', Status.INVALID_INPUT, 'Invalid book ID', requestId));
              break;
            }
            
            const validatedData = validateBookInput(req.book, false);
            
            if (!validatedData || Object.keys(validatedData).length === 0) {
              call.write(createResponse('UPDATE', Status.INVALID_INPUT, 
                'Invalid book data - at least one field must be provided', requestId));
              break;
            }
            
            const updatedBook = await bookStore.updateBook(bookId, validatedData);
            
            if (updatedBook) {
              call.write(createResponse('UPDATE', Status.SUCCESS, 'Book updated successfully', requestId, {
                book: bookToProto(updatedBook),
              }));
            } else {
              call.write(createResponse('UPDATE', Status.NOT_FOUND, 'Book not found', requestId));
            }
            break;
          }

          case ActionType.DELETE: {
            const bookId = req.book_id;
            if (!isValidBookId(bookId)) {
              call.write(createResponse('DELETE', Status.INVALID_INPUT, 'Invalid book ID', requestId));
              break;
            }
            
            const bookToDelete = await bookStore.getBook(bookId);
            
            if (!bookToDelete) {
              call.write(createResponse('DELETE', Status.NOT_FOUND, 'Book not found', requestId));
              break;
            }
            
            const deleted = await bookStore.deleteBook(bookId);
            const totalCount = await bookStore.count();
            
            if (deleted) {
              call.write(createResponse('DELETE', Status.SUCCESS, 'Book deleted successfully', requestId, {
                book: bookToProto(bookToDelete),
                totalCount,
              }));
            } else {
              call.write(createResponse('DELETE', Status.NOT_FOUND, 'Book not found', requestId));
            }
            break;
          }

          case ActionType.SUBSCRIBE: {
            const books = await bookStore.getAllBooks();
            call.write(createResponse('SUBSCRIBE', Status.SUCCESS, 'Subscribed to book updates', requestId, {
              books: books.map(bookToProto),
              totalCount: books.length,
            }));
            break;
          }

          default: {
            call.write(createResponse('UNKNOWN', Status.ERROR, 'Unknown action', requestId));
          }
        }
      } catch {
        call.write(createResponse(ActionType[action] || 'UNKNOWN', Status.ERROR, 'Internal server error', requestId));
      }
    });

    call.on('end', () => {
      isStreamActive = false;
      unsubscribe();
      call.end();
    });

    call.on('error', () => {
      isStreamActive = false;
      unsubscribe();
    });
  },
};

export function createGrpcServer(): grpc.Server {
  const server = new grpc.Server();
  server.addService(proto.book.BookService.service, bookService);
  return server;
}

export { proto };
