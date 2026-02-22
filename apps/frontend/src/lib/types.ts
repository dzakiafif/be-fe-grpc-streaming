export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  publishedYear: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookFormData {
  title: string;
  author: string;
  description: string;
  publishedYear: number;
}

export enum ActionType {
  UNKNOWN = 0,
  LIST = 1,
  GET = 2,
  CREATE = 3,
  UPDATE = 4,
  DELETE = 5,
  SUBSCRIBE = 6,
}

export interface BookResponse {
  action: string;
  status: string;
  message: string;
  requestId: string;
  books?: Book[];
  book?: Book;
  totalCount?: number;
  timestamp: string;
}

export type StreamHandler = (response: BookResponse) => void;
