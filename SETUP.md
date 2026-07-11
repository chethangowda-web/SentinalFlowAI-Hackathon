# SentinelFlow Setup Guide

## Prerequisites
- Node.js >= 22.13.0
- pnpm (recommended) or npm
- Postgres instance (for data persistence)
- Qdrant instance (for vector embeddings)

## Installation

1. Clone the repository and install dependencies from the root:
   ```bash
   pnpm install
   ```

2. Environment Configuration:
   Create a `.env` file in the `backend/` directory based on `.env.example`:
   ```bash
   DATABASE_URL=postgres://user:pass@localhost:5432/sentinelflow
   QDRANT_URL=http://localhost:6333
   OPENAI_API_KEY=your-api-key
   JWT_SECRET=your-secure-secret
   ```

3. Initialize Databases (if applicable):
   If using Prisma/Drizzle, run migrations:
   ```bash
   pnpm --filter backend run db:push
   ```

## Running the Application

### Backend
Navigate to the `backend/` directory and start the development server:
```bash
cd backend
pnpm run dev
```

The backend server runs on `http://localhost:3000` by default.

### Frontend
Navigate to the `frontend/` directory and start the Vite dev server:
```bash
cd frontend
pnpm run dev
```

The frontend application runs on `http://localhost:5173`.

## Demo Mode

To see the platform in action without setting up real telemetry pipelines, trigger the Demo Mode:
```bash
curl -X POST http://localhost:3000/api/v1/demo/start
```
This will simulate traffic, errors, and incidents.
