import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import type { SignUpBody, LoginBody, ForgotPasswordBody } from '../types';
import type { PassportUser } from '../config/passport';
import { googleCallbackUrl } from '../config/passport';
import { getRingCentralSDK, isRingCentralConfigured, getRingCentralMissingEnv } from '../config/ringcentral';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const SALT_ROUNDS = 10;

interface ProfileUpsert {
  userId: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  provider?: string | null;
}

function upsertProfile({ userId, email, fullName, avatarUrl, provider }: ProfileUpsert) {
  const row: Record<string, unknown> = {
    id: userId,
    email,
    full_name: fullName ?? null,
    avatar_url: avatarUrl ?? null,
    updated_at: new Date().toISOString(),
  };
  if (provider) (row as Record<string, unknown>).provider = provider;
  return supabase.from('profiles').upsert(row, { onConflict: 'id' });
}

function signToken(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email },
    env.sessionSecret,
    { expiresIn: '7d' }
  );
}

/** POST /auth/signup - email, password, confirmPassword (custom JWT auth) */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, confirmPassword } = req.body as SignUpBody;

    if (!email || !password || !confirmPassword) {
      res.status(400).json({ error: 'Email, password and confirm password are required' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Password and confirm password do not match' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { data: userRow, error: insertError } = await supabase
      .from('users')
      .insert({ email: normalizedEmail, password_hash: passwordHash })
      .select('id, email')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        res.status(400).json({ error: 'An account with this email already exists' });
        return;
      }
      res.status(400).json({ error: insertError.message });
      return;
    }

    await upsertProfile({ userId: userRow.id, email: userRow.email ?? normalizedEmail });

    const token = signToken(userRow.id, userRow.email ?? normalizedEmail);
    res.status(201).json({
      message: 'Signup successful.',
      user: { id: userRow.id, email: userRow.email ?? normalizedEmail },
      token,
    });
  } catch (e) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

/** POST /auth/login - email, password (custom JWT auth) */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { data: userRow, error: selectError } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', normalizedEmail)
      .single();

    if (selectError || !userRow) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    await upsertProfile({ userId: userRow.id, email: userRow.email ?? normalizedEmail });

    const token = signToken(userRow.id, userRow.email ?? normalizedEmail);
    res.json({
      token,
      user: { id: userRow.id, email: userRow.email ?? normalizedEmail },
    });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

/** POST /auth/forgot-password - email (stub: no Supabase Auth) */
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as ForgotPasswordBody;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    res.json({
      message: 'If an account exists, you will receive a password reset email. (Configure your own email provider to implement this.)',
    });
  } catch (e) {
    res.status(500).json({ error: 'Forgot password failed' });
  }
});

/** GET /auth/google/redirect-uri - returns the exact redirect URI to add in Google Console (fixes redirect_uri_mismatch) */
router.get('/google/redirect-uri', (_req: Request, res: Response): void => {
  res.json({
    redirect_uri: googleCallbackUrl,
    message: 'Add this EXACT value in Google Cloud Console → APIs & Services → Credentials → your OAuth client → Authorized redirect URIs',
  });
});

/** GET /auth/google - Passport: redirect to Google OAuth */
router.get(
  '/google',
  (req: Request, res: Response, next: NextFunction) => {
    if (!env.googleClientId || !env.googleClientSecret) {
      res.status(503).json({ error: 'Google OAuth is not configured' });
      return;
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }
);

/** GET /auth/google/callback - Passport callback, then redirect to frontend with JWT */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${env.frontendUrl}/login`,
    failureMessage: true,
  }),
  (req: Request, res: Response): void => {
    const user = req.user as PassportUser;
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      env.sessionSecret,
      { expiresIn: '7d' }
    );
    const userJson = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email }));
    res.redirect(`${env.frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&user=${userJson}`);
  }
);

/** POST /auth/ringcentral - get RingCentral OAuth URL (requires JWT). Frontend redirects user to returned authUrl. */
router.post('/ringcentral', requireAuth, (req: Request, res: Response): void => {
  if (!isRingCentralConfigured()) {
    const missing = getRingCentralMissingEnv();
    const message =
      missing.length > 0
        ? `RingCentral not configured. Missing in backend/.env: ${missing.join(', ')}. Restart the backend after adding them.`
        : 'RingCentral OAuth is not configured. Set RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_CALLBACK_URL in backend/.env and restart.';
    res.status(503).json({ error: message, missing });
    return;
  }
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const sdk = getRingCentralSDK();
    const platform = sdk.platform();
    const authUrl = platform.loginUrl({ state: userId });
    res.json({ authUrl });
  } catch (e) {
    res.status(500).json({ error: 'Failed to initiate RingCentral OAuth' });
  }
});

/** GET /auth/ringcentral/callback - RingCentral OAuth callback */
router.get('/ringcentral/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state) {
    res.redirect(`${env.frontendUrl}/dashboard?error=ringcentral_missing_code`);
    return;
  }
  const userId = state;
  try {
    const sdk = getRingCentralSDK();
    const platform = sdk.platform();
    await platform.login({ code });
    const token = await platform.auth().data();
    const accessToken = (token as { access_token?: string }).access_token;
    const refreshToken = (token as { refresh_token?: string }).refresh_token;
    const expiresIn = (token as { expires_in?: number }).expires_in ?? 3600;
    if (!accessToken || !refreshToken) {
      res.redirect(`${env.frontendUrl}/dashboard?error=ringcentral_no_tokens`);
      return;
    }
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    await supabase.from('ringcentral_tokens').upsert(
      { user_id: userId, access_token: accessToken, refresh_token: refreshToken, expires_at: expiresAt, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    res.redirect(`${env.frontendUrl}/dashboard?ringcentral=connected`);
  } catch (e) {
    console.error('RingCentral OAuth error:', e);
    res.redirect(`${env.frontendUrl}/dashboard?error=ringcentral_failed`);
  }
});

/** GET /auth/ringcentral/redirect-uri - returns the exact redirect URI to add in RingCentral app (fixes OAU-109) */
router.get('/ringcentral/redirect-uri', (_req: Request, res: Response): void => {
  const redirectUri = env.ringcentralCallbackUrl || 'http://localhost:3001/auth/ringcentral/callback';
  res.json({
    redirect_uri: redirectUri,
    message:
      'Add this EXACT value in RingCentral Developer Portal → your app → Auth → Redirect URI. No trailing slash.',
  });
});

/** GET /auth/ringcentral/status - check if user has RingCentral linked (requires auth) */
router.get('/ringcentral/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const { data } = await supabase.from('ringcentral_tokens').select('id').eq('user_id', userId).single();
  res.json({ connected: !!data });
});

export default router;
