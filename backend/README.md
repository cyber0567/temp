# NestJS API + WebSocket (Supabase)

Node.js backend with **NestJS**, TypeScript, WebSocket (ws), and **Supabase (hosted PostgreSQL)** for auth and data. There is no local database file — the database lives in your Supabase project in the cloud.

## Features

- **Auth**: Custom JWT (email/password signup + login), Sign in with Google (Passport), **Supabase Auth** (email OTP for verification; magic link/reset), RingCentral OAuth
- **Database**: PostgreSQL via **Supabase** — tables `public.users`, `public.profiles`, organizations, etc. (see [Database](#database))
- **WebSocket**: Authenticated WS at `/ws?token=ACCESS_TOKEN` (JWT in query or `Sec-WebSocket-Protocol`). Send JSON `{ "event": "message", "data": <payload> }` to broadcast to all connected clients.

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Database (Supabase — required)**

   Create a **Supabase** project and use **Prisma** for migrations.

   - Go to [supabase.com](https://supabase.com) → **New project**.
   - In **Project Settings → Database** copy the **Connection string** (URI). Use the **direct** connection (port **5432**) for migrations.
   - Set `DATABASE_URL` in `.env` to that URI (replace `[YOUR-PASSWORD]` with your DB password).
   - Run migrations: `npm run db:migrate` (or `npx prisma migrate deploy` in production).
   - **Project Settings → API**: copy **Project URL** and **service_role** key for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

   **Prisma commands:** `npm run db:generate` (generate client), `npm run db:migrate` (dev migrate), `npm run db:migrate:deploy` (deploy migrations), `npm run db:studio` (open Prisma Studio).

3. **Environment**

   ```bash
   cp .env.example .env
   ```

   Fill in `.env` (see `.env.example`): `DATABASE_URL` (Supabase PostgreSQL URI for Prisma), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` (for Supabase session exchange), `FRONTEND_URL`, `SESSION_SECRET`, Google OAuth vars, RingCentral vars.

   **Supabase Auth:** In Dashboard → Authentication → URL Configuration, add Redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/reset-password`. Run migration **009_supabase_auth_user_id.sql**.

4. **Run**

   ```bash
   npm run start:dev
   ```

   API: `http://localhost:3001` (or your `PORT`)  
   **Check database**: `GET http://localhost:3001/db-check`  
   WebSocket: `ws://localhost:3001/ws?token=ACCESS_TOKEN`

## API

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | `{ email, password, confirmPassword }` | Sign up |
| POST | `/auth/login` | `{ email, password }` | Login |
| POST | `/auth/forgot-password` | `{ email }` | Stub; frontend uses Supabase reset |
| POST | `/auth/supabase-session` | `{ access_token }` | Exchange Supabase token for app JWT |
| POST | `/auth/supabase-update-password` | `{ access_token, password }` | Sync password after Supabase recovery |
| POST | `/auth/verify-email` | `{ email, code }` | Verify Supabase Auth OTP (6-digit from email) |
| POST | `/auth/resend-verification` | `{ email }` | Resend Supabase OTP email |
| GET | `/auth/google` | — | Redirect to Google OAuth |
| GET | `/auth/google/callback` | — | OAuth callback |
| GET | `/auth/google/redirect-uri` | — | Get redirect URI for Google Console |
| POST | `/auth/ringcentral` | — | Get RingCentral auth URL (auth required) |
| GET | `/auth/ringcentral/callback` | — | RingCentral OAuth callback |
| GET | `/auth/ringcentral/redirect-uri` | — | Get redirect URI for RingCentral |
| GET | `/auth/ringcentral/status` | — | Check if RingCentral linked (auth required) |
| DELETE | `/auth/ringcentral` | — | Disconnect RingCentral (auth required) |
| GET | `/integrations/ringcentral/auth` | `?state=JWT` | Server redirect to RingCentral OAuth |
| GET | `/integrations/ringcentral/init` | — | Get init URL for redirect flow (auth required) |
| GET | `/integrations/ringcentral/status` | — | Connection status `{ connected, expiresAt }` (auth required) |
| GET | `/health` | — | Health check |
| GET | `/db-check` | — | Database connection and tables |
| GET | `/me` | Header: `Authorization: Bearer <token>` | Current user and orgs |
| GET / POST / PATCH / DELETE | `/orgs` | — | List/create orgs; members CRUD (see org routes) |
| GET / PATCH | `/admin/users` | — | List users / set platform role (super_admin only) |

## WebSocket

- **URL**: `ws://localhost:3001/ws?token=YOUR_ACCESS_TOKEN`
- **Auth**: JWT as query `token` or in `Sec-WebSocket-Protocol` as `Bearer <token>`.
- **Connected**: Server sends `{ type: 'connected', userId, email }`.
- **Messages**: Send JSON `{ "event": "message", "data": <any payload> }`; server broadcasts `{ type: 'message', from, payload }` to all connected clients.

## Database

Supabase (hosted PostgreSQL). **Migrations are managed by Prisma** (`prisma/schema.prisma` and `prisma/migrations/`). Tables: `users`, `profiles`, `organizations`, `organization_members`, `ringcentral_tokens`. Verify with `GET /db-check`.

**User roles and orgs** are read and written only through **Prisma** (not the Supabase client). So platform role (`profiles.platform_role`) and org membership (`organization_members`) stay in sync with the schema. Run `npx prisma migrate deploy` (or `npm run db:migrate:deploy`) once so the tables exist; after that you do not need to change the database schema for roles and orgs.

**If you already applied the old SQL migrations** (001–009) and want to switch to Prisma: run `npx prisma migrate resolve --applied 20250211000000_init` once (with `DATABASE_URL` set) so Prisma marks the initial migration as applied; then use Prisma for future changes.
