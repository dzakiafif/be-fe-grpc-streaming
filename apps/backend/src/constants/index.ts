export const CONFIG = {
  HOST: process.env.HOST ?? 'localhost',
  HTTP_PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  GRPC_PORT: process.env.GRPC_PORT ? Number(process.env.GRPC_PORT) : 50051,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
} as const;

export const VALIDATION = {
  TITLE_MAX_LENGTH: 200,
  AUTHOR_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 2000,
  MIN_PUBLISHED_YEAR: 1000,
  MAX_PUBLISHED_YEAR_OFFSET: 10,
} as const;

export const GRPC_STATUS = {
  OK: 0,
  CANCELLED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  ABORTED: 10,
  OUT_OF_RANGE: 11,
  UNIMPLEMENTED: 12,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  DATA_LOSS: 15,
  UNAUTHENTICATED: 16,
} as const;
