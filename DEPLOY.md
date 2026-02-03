# Deploy to Vercel

App URL: **https://mvp-ten-black.vercel.app** (or your Vercel domain)

## 1. Project settings

- **Root Directory:** `src` (required)
- **Framework:** Next.js (auto-detected)

## 2. Environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Postgres connection string | Required. Use Supabase, Neon, or Vercel Postgres |
| `NEXTAUTH_SECRET` | Strong random string | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://<your-vercel-domain>` | Must match deployment URL |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID | Optional, for Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret | Optional, for Google sign-in |

### Database (Postgres)

Use one of:

- **Supabase:** Project → Settings → Database → Connection string (URI)
- **Neon:** Dashboard → Connection string
- **Vercel Postgres:** Vercel → Storage → Create Database → Postgres

Then run migrations against that DB (e.g. from your machine with `DATABASE_URL` set):

```bash
cd src && npx prisma migrate deploy
```

## 3. Google OAuth (optional)

Add this redirect URI in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

```
https://<your-vercel-domain>/api/auth/callback/google
```

## 4. Deploy

Push to your connected branch. Vercel will run `prisma generate` in postinstall and build the app.

**Note:** WebSocket (`/ws`) is not supported on Vercel serverless. The WebSocket status component will show “unavailable” unless you point `NEXT_PUBLIC_WS_URL` to an external WebSocket server.
