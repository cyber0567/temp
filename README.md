# MVP – Single Next.js App (Vercel-ready)

One Next.js app with:

- **NextAuth** (database sessions via Prisma)
- **PostgreSQL** (Prisma 7 + `@prisma/adapter-pg`)
- **Auth**: Email/password (Credentials) + Google OAuth
- **Tailwind** + shadcn-style UI

Database: use **Supabase PostgreSQL** or any Postgres (e.g. Neon, Vercel Postgres).

## Quick start

1. **Install and generate Prisma client**

```bash
cd src && npm install
```

2. **Environment variables**

- Copy `src/.env.example` to `src/.env.local`
- Set `DATABASE_URL` (Postgres connection string)
- Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`

3. **Database**

```bash
cd src
npx prisma migrate dev --name init
```

4. **Run**

```bash
cd src && npm run dev
```

App: `http://localhost:3000`.

## Deploy to Vercel

1. In Vercel, create a project from this repo.
2. Set **Root Directory** to `src`.
3. Add environment variables in the Vercel project:
   - `DATABASE_URL` (required, e.g. Supabase or Neon connection string)
   - `NEXTAUTH_SECRET` (required)
   - `NEXTAUTH_URL` = `https://<your-vercel-domain>`
   - Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for Google sign-in
4. Deploy. Run migrations against your production DB (e.g. `npx prisma migrate deploy` from `src` with `DATABASE_URL` set).

**Note:** WebSocket (`/ws`) is not supported on Vercel serverless. The WebSocket status component will show “unavailable” unless you set `NEXT_PUBLIC_WS_URL` to an external WebSocket server.
