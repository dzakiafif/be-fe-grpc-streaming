# 📚 Book Manager - gRPC Bidirectional Streaming

A real-time book management application with **bidirectional gRPC streaming** between Backend (Express + gRPC) and Frontend (Next.js 15 App Router).

![Tech Stack](https://img.shields.io/badge/Stack-Express%20%7C%20gRPC%20%7C%20Next.js%2015%20%7C%20React%2019-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 🔥 **Real-time Updates** - Bidirectional gRPC streaming for instant updates
- 📱 **Modern UI** - Next.js 15 with App Router and Tailwind CSS
- 🔄 **Auto-reconnect** - Automatic connection recovery if disconnected
- 🗄️ **Database Options** - In-memory (default) or Supabase (persistent)
- 🔍 **Search** - Real-time book search
- 📊 **Connection Status** - Streaming connection status indicator

## 🏗️ Architecture

```
Browser ←──SSE──→ Next.js API ←──gRPC──→ Backend Server ←──→ Database
         (Real-time)              (Streaming)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend  
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

### 3. Run Application

**Terminal 1 - Backend:**
```bash
npx nx serve @be-fe-grpc-streaming/backend
```

**Terminal 2 - Frontend:**
```bash
npx nx serve @be-fe-grpc-streaming/frontend
```

### 4. Open Browser

Navigate to http://localhost:3001 (or the port shown in the terminal)

## 📖 Detailed Setup

For complete setup including Supabase configuration, see [SETUP.md](./SETUP.md)

## 📁 Project Structure

```
apps/
├── backend/              # Express + gRPC Server
│   ├── src/
│   │   ├── main.ts
│   │   ├── services/
│   │   │   ├── bookService.ts    # gRPC implementation
│   │   │   └── bookStore.ts      # Data layer
│   │   └── proto/
│   │       └── book.proto        # Proto definition
│   └── .env
│
└── frontend/             # Next.js 15 + React
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx            # Main UI
    │   │   └── api/stream/route.ts # SSE endpoint
    │   ├── components/
    │   │   ├── BookCard.tsx
    │   │   ├── BookForm.tsx
    │   │   └── ConnectionStatus.tsx
    │   └── hooks/
    │       └── useBooks.ts         # Real-time hook
    └── .env.local
```

## 🎯 Key Components

### Backend (gRPC Server)
- **Bidirectional Streaming** - `StreamBooks` RPC with duplex streaming
- **Actions** - LIST, GET, CREATE, UPDATE, DELETE, SUBSCRIBE
- **Broadcasting** - Update to all connected clients
- **Supabase Realtime** - Optional database with realtime sync

### Frontend
- **useBooks Hook** - Custom React hook to manage state & streaming
- **Server-Sent Events** - Bridge gRPC streaming to browser
- **Optimistic Updates** - UI update before server confirmation

## 🔌 gRPC Proto Definition

```protobuf
service BookService {
  rpc StreamBooks(stream BookStreamRequest) returns (stream BookStreamResponse);
}

message Book {
  string id = 1;
  string title = 2;
  string author = 3;
  string description = 4;
  int32 published_year = 5;
}

enum ActionType {
  LIST = 1; GET = 2; CREATE = 3; 
  UPDATE = 4; DELETE = 5; SUBSCRIBE = 6;
}
```

## 🛠️ Commands

```bash
# Development
npx nx serve @be-fe-grpc-streaming/backend
npx nx serve @be-fe-grpc-streaming/frontend    

# Build
npx nx build @be-fe-grpc-streaming/backend      
npx nx build @be-fe-grpc-streaming/frontend     

# Lint & Test
npx nx lint @be-fe-grpc-streaming/backend
npx nx test @be-fe-grpc-streaming/backend
```

## 🧪 Testing gRPC

Using [grpcurl](https://github.com/fullstorydev/grpcurl):

```bash
# List books
grpcurl -plaintext -d '{"action": "LIST", "request_id": "test"}' \
  localhost:50051 book.BookService/StreamBooks

# Create book
grpcurl -plaintext -d '{
  "action": "CREATE",
  "request_id": "test",
  "book": {
    "title": "Test Book",
    "author": "Test Author",
    "published_year": 2024
  }
}' localhost:50051 book.BookService/StreamBooks
```

## 📝 Environment Variables

### Backend (`apps/backend/.env`)
```env
HOST=localhost
PORT=3000
GRPC_PORT=50051
SUPABASE_URL=          # Optional
SUPABASE_SERVICE_ROLE_KEY=  # Optional
```

### Frontend (`apps/frontend/.env.local`)
```env
GRPC_BACKEND_HOST=localhost:50051
```

## 🐳 Docker

```bash
# Build and run with Docker
docker build -t book-manager-backend -f apps/backend/Dockerfile .
docker run -p 3000:3000 -p 50051:50051 book-manager-backend
```

## 📚 Documentation

- [SETUP.md](./SETUP.md) - Complete setup guide
- [SECURITY.md](./SECURITY.md) - Security considerations
- [gRPC Basics](https://grpc.io/docs/languages/node/basics/)
- [Next.js 15 Docs](https://nextjs.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Distributed under MIT License. See [LICENSE](./LICENSE) for more information.

---

Built with ❤️ using Nx, Express, gRPC, Next.js, and React
