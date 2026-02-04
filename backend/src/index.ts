import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import authRoutes from './routes/auth';
import { requireAuth, AuthenticatedRequest } from './middleware/auth';
import { env } from './config/env';
import { supabase } from './config/supabase';
import './config/passport';

const app = express();
const server = createServer(app);

// CORS: accept origin with or without trailing slash (browsers send no trailing slash)
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || !env.frontendUrl) return cb(null, true);
      const allowed = env.frontendUrl.replace(/\/$/, '');
      const match = origin === allowed || origin === env.frontendUrl;
      cb(null, match ? origin : false);
    },
    credentials: true,
  })
);
app.use(express.json());

// Type assertions for express-session/passport @types compatibility with express
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.nodeEnv === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }) as any
);
app.use(passport.initialize() as any);
app.use(passport.session() as any);

app.use('/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

/** Check database connection and required tables (Supabase). No auth required. */
app.get('/db-check', async (_req, res) => {
  try {
    const [usersRes, profilesRes] = await Promise.all([
      supabase.from('users').select('id').limit(1),
      supabase.from('profiles').select('id').limit(1),
    ]);
    const usersOk = usersRes.error === null;
    const profilesOk = profilesRes.error === null;
    const ok = usersOk && profilesOk;
    res.status(ok ? 200 : 503).json({
      ok,
      database: 'Supabase (hosted PostgreSQL)',
      tables: {
        users: usersOk ? 'ok' : (usersRes.error?.message ?? 'missing or inaccessible'),
        profiles: profilesOk ? 'ok' : (profilesRes.error?.message ?? 'missing or inaccessible'),
      },
      hint: !ok
        ? 'Create a Supabase project at supabase.com, run migrations in SQL Editor (001, 002, 003), set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
        : undefined,
    });
  } catch (e) {
    res.status(503).json({
      ok: false,
      error: e instanceof Error ? e.message : 'Database check failed',
      hint: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env and run migrations in Supabase SQL Editor.',
    });
  }
});

app.get('/me', requireAuth, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  res.json({
    user: authReq.user
      ? { id: authReq.user.sub, email: authReq.user.email }
      : null,
  });
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token') ?? req.headers['sec-websocket-protocol']?.replace('Bearer ', '');
  const allowAnonymous = env.nodeEnv === 'development' && process.env.WS_ALLOW_ANONYMOUS === 'true';

  if (!token && !allowAnonymous) {
    ws.close(4001, 'Missing auth token');
    return;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.sessionSecret) as { sub: string; email?: string };
      (ws as any).userId = decoded.sub;
      (ws as any).userEmail = decoded.email;
      ws.send(JSON.stringify({ type: 'connected', userId: decoded.sub, email: decoded.email }));
    } catch {
      ws.close(4002, 'Invalid or expired token');
      return;
    }
  } else {
    (ws as any).userId = null;
    (ws as any).userEmail = null;
    ws.send(JSON.stringify({ type: 'connected', message: 'Anonymous (dev only)' }));
  }

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const from = (ws as any).userEmail ?? 'anonymous';
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'message', from, payload: data }));
        }
      });
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
    }
  });

  ws.on('close', () => {
    // optional: log disconnect to DB
  });
});

server.listen(env.port, () => {
  console.log(`API and WebSocket server listening on http://localhost:${env.port}`);
  console.log(`WebSocket path: ws://localhost:${env.port}/ws?token=YOUR_ACCESS_TOKEN`);
});
