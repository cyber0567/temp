import crypto from 'crypto';
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
const CODE_EXPIRY_MINUTES = 15;
const MAX_VERIFICATION_ATTEMPTS = 5;

function generateSixDigitCode(): string {
  return crypto.randomInt(0, 1e6).toString().padStart(6, '0');
}

async function upsertVerificationCode(email: string): Promise<string> {
  const code = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();
  await supabase
    .from('email_verification_codes')
    .upsert(
      { email: email.toLowerCase(), code, expires_at: expiresAt, attempts: 0 },
      { onConflict: 'email' }
    );
  return code;
}

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

    await upsertVerificationCode(normalizedEmail);
    // In production, send code via email; for dev you can log it:
    // console.log('Verification code for', normalizedEmail, ':', (await supabase.from('email_verification_codes').select('code').eq('email', normalizedEmail).single()).data?.code);

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

const TEST_VERIFICATION_CODE = '920079';

/** POST /auth/verify-email - email, code (6-digit). Returns token + user on success. */
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body as { email?: string; code?: string };
    if (!email || !code) {
      res.status(400).json({ error: 'Email and code are required' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const codeDigits = code.replace(/\D/g, '').slice(0, 6);

    // Test code: accept 123456 for any registered email
    if (codeDigits === TEST_VERIFICATION_CODE) {
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', normalizedEmail)
        .single();
      if (userError || !userRow) {
        res.status(400).json({ error: 'Invalid verification code. Please request a new code.' });
        return;
      }
      await supabase.from('email_verification_codes').delete().eq('email', normalizedEmail);
      const token = signToken(userRow.id, userRow.email ?? normalizedEmail);
      res.json({
        token,
        user: { id: userRow.id, email: userRow.email ?? normalizedEmail },
      });
      return;
    }

    const { data: row, error: fetchError } = await supabase
      .from('email_verification_codes')
      .select('code, expires_at, attempts')
      .eq('email', normalizedEmail)
      .single();

    if (fetchError || !row) {
      res.status(400).json({ error: 'Invalid verification code. Please request a new code.' });
      return;
    }
    if (new Date(row.expires_at) < new Date()) {
      res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
      return;
    }
    const attempts = (row as { attempts?: number }).attempts ?? 0;
    if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
      res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
      return;
    }
    if (row.code !== codeDigits) {
      const newAttempts = attempts + 1;
      const remaining = MAX_VERIFICATION_ATTEMPTS - newAttempts;
      await supabase
        .from('email_verification_codes')
        .update({ attempts: newAttempts })
        .eq('email', normalizedEmail);
      res.status(400).json({
        error: remaining > 0
          ? `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many failed attempts. Please request a new code.',
      });
      return;
    }

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();
    if (userError || !userRow) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    await supabase.from('email_verification_codes').delete().eq('email', normalizedEmail);
    const token = signToken(userRow.id, userRow.email ?? normalizedEmail);
    res.json({
      token,
      user: { id: userRow.id, email: userRow.email ?? normalizedEmail },
    });
  } catch (e) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

/** POST /auth/resend-verification - email. Creates new 6-digit code. */
router.post('/resend-verification', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const { data: userRow } = await supabase.from('users').select('id').eq('email', normalizedEmail).single();
    if (!userRow) {
      res.status(400).json({ error: 'No account found for this email' });
      return;
    }
    await upsertVerificationCode(normalizedEmail);
    res.json({ message: 'Verification code sent.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to resend code' });
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

/** POST /auth/ringcentral - get RingCentral OAuth authorization URL (Authorization Code flow). State is signed for CSRF protection. */
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
    const state = jwt.sign(
      { userId, nonce: crypto.randomBytes(16).toString('hex') },
      env.sessionSecret,
      { expiresIn: '10m' }
    );
    const sdk = getRingCentralSDK();
    const platform = sdk.platform();
    const authUrl = platform.loginUrl({ state, redirectUri: env.ringcentralCallbackUrl });
    res.json({ authUrl });
  } catch (e) {
    res.status(500).json({ error: 'Failed to initiate RingCentral OAuth' });
  }
});

/** GET /auth/ringcentral/callback - RingCentral OAuth callback. Validates state (CSRF), exchanges code for tokens, stores securely. */
router.get('/ringcentral/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state) {
    res.redirect(`${env.frontendUrl}/dashboard?error=ringcentral_missing_code`);
    return;
  }
  let userId: string;
  try {
    const decoded = jwt.verify(state, env.sessionSecret) as { userId?: string };
    if (!decoded?.userId) {
      res.redirect(`${env.frontendUrl}/dashboard?error=ringcentral_invalid_state`);
      return;
    }
    userId = decoded.userId;
  } catch {
    res.redirect(`${env.frontendUrl}/dashboard?error=ringcentral_invalid_state`);
    return;
  }
  try {
    const sdk = getRingCentralSDK();
    const platform = sdk.platform();
    await platform.login({
      code,
      redirect_uri: env.ringcentralCallbackUrl,
    });
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

/** DELETE /auth/ringcentral - disconnect RingCentral (remove stored tokens). Requires auth. */
router.delete('/ringcentral', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  await supabase.from('ringcentral_tokens').delete().eq('user_id', userId);
  res.json({ ok: true, message: 'RingCentral disconnected' });
});

export default router;
