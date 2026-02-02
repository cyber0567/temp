# NextJS Fullstack Starter

This repository contains two NextJS apps:

- `frontend`: TailwindCSS + shadcn/ui starter with a WebSocket client
- `backend`: NextAuth + PostgreSQL (Prisma) + WebSocket server

## Quick start

1. Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Configure environment variables:

- `backend/.env` from `backend/.env.example`
- `frontend/.env.local` from `frontend/.env.example`

3. Set up the database:

```bash
cd backend
npx prisma migrate dev --name init
```

4. Run both apps:

```bash
cd backend && npm run dev
cd ../frontend && npm run dev
```

Backend defaults to `http://localhost:3001` and WebSocket at `ws://localhost:3001/ws`.
