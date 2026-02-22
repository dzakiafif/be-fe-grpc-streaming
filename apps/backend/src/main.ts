import express from 'express';
import * as grpc from '@grpc/grpc-js';
import { createGrpcServer } from './services/bookService';
import { CONFIG } from './constants';

const app = express();

app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (CONFIG.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'"
    );
  }
  
  next();
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (!origin || CONFIG.ALLOWED_ORIGINS.length === 0 || CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  
  next();
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Book API Server',
    services: ['HTTP REST', 'gRPC'],
    grpcPort: CONFIG.GRPC_PORT,
    environment: CONFIG.NODE_ENV,
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ 
    error: CONFIG.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

app.listen(CONFIG.HTTP_PORT, CONFIG.HOST, () => {});

const grpcServer = createGrpcServer();
const grpcCredentials = grpc.ServerCredentials.createInsecure();

grpcServer.bindAsync(
  `${CONFIG.HOST}:${CONFIG.GRPC_PORT}`,
  grpcCredentials,
  (err, port) => {
    if (err) {
      return;
    }
    grpcServer.start();
  }
);

process.on('SIGTERM', () => {
  grpcServer.tryShutdown(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  grpcServer.tryShutdown(() => {
    process.exit(0);
  });
});
