# Deploy to Vercel

App URL: **https://mvp-ten-black.vercel.app**

## 1. Project settings

- **Root Directory:** `frontend` (required for monorepo)
- **Framework:** Next.js (auto-detected)

## 2. Environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXTAUTH_SECRET` | Strong random string | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://mvp-ten-black.vercel.app` | Must match deployment URL |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID | For Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret | For Google sign-in |
| `KV_REST_API_URL` | (from Upstash) | For email/password auth |
| `KV_REST_API_TOKEN` | (from Upstash) | For email/password auth |

### Upstash Redis (email auth)

1. Vercel → Storage → Create Database
2. Select **Upstash Redis** (from Marketplace)
3. Create database and connect to your project
4. `KV_REST_API_URL` and `KV_REST_API_TOKEN` are added automatically

## 3. Google OAuth

Add this redirect URI in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

```
https://mvp-ten-black.vercel.app/api/auth/callback/google
```

## 4. Deploy

Push to your connected branch. Vercel will build and deploy automatically.
