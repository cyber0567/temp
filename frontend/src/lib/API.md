# Backend API (localhost:3001)

The frontend assumes the following endpoints and WebSocket.

## Base URL

- **API**: `http://localhost:3001` (or `NEXT_PUBLIC_API_URL`)
- **WebSocket**: `ws://localhost:3001` (or `NEXT_PUBLIC_WS_URL`)

## Auth

### POST /auth/login

- **Body**: `{ "email": string, "password": string }`
- **Success (200)**: `{ "user": { "id": string, "email": string, "name"?: string }, "token": string }`
- **Error (4xx/5xx)**: `{ "message": string, "errors"?: Record<string, string> }`

### POST /auth/signup

- **Body**: `{ "email": string, "password": string }`
- **Success (200)**: `{ "user": { "id": string, "email": string, "name"?: string }, "token": string }`
- **Error**: same as login

### POST /auth/forgot-password

- **Body**: `{ "email": string }`
- **Success (200)**: `{ "message": string }`
- **Error**: same shape as above

### GET /auth/google/url

- **Query (optional)**: `redirect_uri` – OAuth callback URL
- **Success (200)**: `{ "url": string }` – redirect user to this URL for Google OAuth

### POST /auth/google/callback

- **Body**: `{ "code": string, "redirect_uri"?: string }` – code from Google redirect
- **Success (200)**: `{ "user": { ... }, "token": string }` – same as login
- **Error**: same shape as above

## WebSocket

- **URL**: `ws://localhost:3001` (or path your backend exposes, e.g. `ws://localhost:3001/ws`)
- The app connects on load and reads all incoming messages. Messages are stored in `WebSocketContext` (last 100). Use `useWebSocketContext()` or `useWebSocketContextOptional()` to read `status`, `lastMessage`, `messages`, and `clearMessages()`.
