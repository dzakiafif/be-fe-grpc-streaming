export enum ActionType {
  UNKNOWN = 0,
  LIST = 1,
  GET = 2,
  CREATE = 3,
  UPDATE = 4,
  DELETE = 5,
  SUBSCRIBE = 6,
}

export enum Status {
  SUCCESS = 0,
  ERROR = 1,
  NOT_FOUND = 2,
  INVALID_INPUT = 3,
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  publishedYear: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookInput {
  title?: string;
  author?: string;
  description?: string;
  publishedYear?: number;
}

export interface BookStreamRequest {
  action: ActionType;
  requestId: string;
  book?: Book;
  bookId?: string;
  searchQuery?: string;
}

export interface BookStreamResponse {
  action: ActionType;
  status: Status;
  message: string;
  requestId: string;
  books?: Book[];
  book?: Book;
  totalCount?: number;
  timestamp: string;
}

export interface ProtoBook {
  id: string;
  title: string;
  author: string;
  description: string;
  published_year: number;
  created_at: string;
  updated_at: string;
}
