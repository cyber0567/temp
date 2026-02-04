# Express TypeScript API + WebSocket (Supabase)

Node.js backend with Express, TypeScript, WebSocket, and **Supabase (hosted PostgreSQL)** for auth and data. There is no local database file — the database lives in your Supabase project in the cloud.

## Features

- **Auth**: Custom JWT (email/password signup + login), Sign in with Google (Passport), forgot-password stub
- **Database**: PostgreSQL via **Supabase** — tables `public.users` and `public.profiles` (see [Database](#database))
- **WebSocket**: Authenticated WS at `/ws?token=ACCESS_TOKEN`

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Database (Supabase — required)**

   The backend does not include a local DB. You must create a **Supabase** project and run the SQL migrations there.

   - Go to [supabase.com](https://supabase.com) → **New project** → choose org, name, password, region.
   - In the project: **SQL Editor** → **New query**. Run each migration in order (copy/paste from `supabase/migrations/`):
     1. `001_profiles.sql` — creates `profiles` and `auth_events`
     2. `002_add_provider.sql` — adds `provider` to profiles
     3. `003_custom_auth_users.sql` — creates `users` and adapts `profiles` for custom auth
   - **Project Settings → API**: copy **Project URL** and **service_role** key (keep secret).

3. **Environment**

   ```bash
   cp .env.example .env
   ```

   Fill in:

   - **`SUPABASE_URL`** — Project URL from Supabase (e.g. `https://xxxx.supabase.co`)
   - **`SUPABASE_SERVICE_ROLE_KEY`** — service_role key from Supabase (Project Settings → API)
   - `FRONTEND_URL` (e.g. `http://localhost:3000`)
   - `SESSION_SECRET` (e.g. `openssl rand -hex 32`)
   - For Google sign-in: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CALLBACK_URL` (e.g. `http://localhost:3001/auth/google/callback`)

4. **Run**

   ```bash
   npm run dev
   ```

   API: `http://localhost:3001` (or your `PORT`)  
   **Check database**: `GET http://localhost:3001/db-check` — returns whether Supabase is connected and tables exist.  
   WebSocket: `ws://localhost:3001/ws?token=ACCESS_TOKEN`

## API

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | `{ email, password, confirmPassword }` | Sign up (confirm password required) |
| POST | `/auth/login` | `{ email, password }` | Login |
| POST | `/auth/forgot-password` | `{ email }` | Send reset email |
| GET | `/auth/google` | — | Returns `{ url }` for Google OAuth redirect |
| GET | `/auth/google/callback` | — | OAuth callback (redirects to frontend with tokens) |
| GET | `/health` | — | Health check |
| GET | `/db-check` | — | Database connection and tables (Supabase) |
| GET | `/me` | Header: `Authorization: Bearer <access_token>` | Current user |

## WebSocket

- **URL**: `ws://localhost:3000/ws?token=YOUR_ACCESS_TOKEN`
- **Auth**: Pass the JWT `access_token` (from login or Google callback) as query `token`.
- **Connected**: Server sends `{ type: 'connected', userId, email }`.
- **Messages**: Send JSON; server broadcasts to all connected clients (optional to scope by room/user).

## Database

- **Where**: The database is **Supabase** (hosted PostgreSQL). There is no database file in this repo — you create a project at [supabase.com](https://supabase.com) and run the migrations in the **SQL Editor**.
- **Tables**:
  - **`public.users`** — email/password users (id, email, password_hash, created_at). Created by `003_custom_auth_users.sql`.
  - **`public.profiles`** — user display info (id, email, full_name, avatar_url, provider, updated_at). Synced on signup, login, and Google sign-in. Created by `001_profiles.sql`; `003` changes `id` to text for custom + OAuth ids.
- **Verify**: After setting `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` and running the three migrations in Supabase, call **`GET /db-check`**. It returns `{ ok: true, tables: { users: 'ok', profiles: 'ok' } }` when the database is reachable and tables exist.
