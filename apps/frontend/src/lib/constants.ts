export const UI = {
  MAX_TITLE_LENGTH: 200,
  MAX_AUTHOR_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_SEARCH_LENGTH: 100,
} as const;

export const TIMEOUTS = {
  RECONNECT_DELAY_MS: 5000,
} as const;

export const GRPC = {
  BACKEND_HOST: process.env.GRPC_BACKEND_HOST || 'localhost:50051',
  PROTO_PATH: 'src/proto/book.proto',
} as const;
