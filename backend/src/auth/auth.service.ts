import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RingCentralService } from '../config/ringcentral.service';
import { SupabaseService } from '../config/supabase.service';
import { env } from '../config/env';

const SALT_ROUNDS = 10;
const DEV_CODE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  // Dev-only: in-memory codes so you can use the code from console log (Supabase never gives us the OTP).
  private static devVerificationCodes = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly ringCentral: RingCentralService,
  ) {}

  signToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email },
      { secret: env.sessionSecret, expiresIn: '7d' },
    );
  }

  /** Dev only: generate a code, store in memory, log to console. Supabase never returns the OTP so this gives a second way to get the code. */
  private devCodeCreateAndLog(email: string): void {
    if (env.nodeEnv !== 'development') return;
    const code = crypto.randomInt(0, 1e8).toString().padStart(8, '0');
    AuthService.devVerificationCodes.set(email, {
      code,
      expiresAt: Date.now() + DEV_CODE_EXPIRY_MS,
    });
    console.log('[dev] Verification code for', email, ':', code);
  }

  /** Dev only: verify against in-memory code. Returns true if valid. */
  private devCodeVerify(email: string, codeDigits: string): boolean {
    if (env.nodeEnv !== 'development') return false;
    const entry = AuthService.devVerificationCodes.get(email);
    if (!entry || entry.expiresAt < Date.now()) return false;
    if (entry.code !== codeDigits) return false;
    AuthService.devVerificationCodes.delete(email);
    return true;
  }

  /**
   * Verify a Supabase-issued JWT (e.g. from email OTP session).
   * Tries JWKS first (for projects using asymmetric signing keys), then legacy JWT secret (HS256).
   */
  private async verifySupabaseAccessToken(
    accessToken: string,
  ): Promise<{ payload: { sub?: string; email?: string } } | { error: string; status: 401 | 503 }> {
    const normalizedUrl = (env.supabaseUrl || '').trim().replace(/\/+$/, '');
    const hasJwks = !!normalizedUrl;
    const hasSecret = !!env.supabaseJwtSecret;

    if (hasJwks) {
      try {
        const jwksUrl = `${normalizedUrl}/auth/v1/.well-known/jwks.json`;
        const { payload } = await jwtVerify(
          accessToken,
          createRemoteJWKSet(new URL(jwksUrl)),
          { clockTolerance: 10 },
        );
        const sub = payload.sub as string | undefined;
        const email = (payload.email as string | undefined) ?? '';
        if (sub) {
          return { payload: { sub, email } };
        }
      } catch {
        // JWKS failed (e.g. no keys for legacy-only project); fall back to secret
      }
    }

    if (hasSecret) {
      try {
        const payload = this.jwtService.verify(accessToken, {
          secret: env.supabaseJwtSecret,
        }) as { sub?: string; email?: string };
        return { payload };
      } catch (err: unknown) {
        const name = err && typeof err === 'object' && 'name' in err ? (err as { name: string }).name : '';
        if (name === 'TokenExpiredError') {
          return { error: 'Verification session expired. Please request a new code and try again.', status: 401 };
        }
        if (name === 'JsonWebTokenError') {
          return {
            error:
              'Invalid token. If using Supabase JWT Signing Keys, ensure SUPABASE_URL is correct. Otherwise set SUPABASE_JWT_SECRET to the JWT Secret in Supabase (Project Settings → API).',
            status: 401,
          };
        }
        return { error: 'Invalid or expired token', status: 401 };
      }
    }

    return {
      error:
        'Supabase Auth is not configured. Set SUPABASE_URL (and optionally SUPABASE_JWT_SECRET for legacy JWT secret).',
      status: 503,
    };
  }

  private async upsertProfile(params: {
    userId: string;
    email: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    provider?: string | null;
  }) {
    await this.prisma.profile.upsert({
      where: { id: params.userId },
      create: {
        id: params.userId,
        email: params.email,
        fullName: params.fullName ?? null,
        avatarUrl: params.avatarUrl ?? null,
        provider: params.provider ?? null,
      },
      update: {
        email: params.email,
        fullName: params.fullName ?? null,
        avatarUrl: params.avatarUrl ?? null,
        provider: params.provider ?? null,
      },
    });
  }

  async signup(email: string, password: string, confirmPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    let userRow: { id: string; email: string };
    try {
      userRow = await this.prisma.user.create({
        data: { email: normalizedEmail, passwordHash },
        select: { id: true, email: true },
      });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'P2002') {
        return { error: 'An account with this email already exists', status: 400 };
      }
      return { error: err.message ?? 'Signup failed', status: 400 };
    }

    await this.upsertProfile({ userId: userRow.id, email: userRow.email ?? normalizedEmail });

    if (env.supabaseUrl && env.supabaseServiceKey) {
      const { error } = await this.supabase.getClient().auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: true },
      });
      if (error) {
        console.error('[signup] Supabase OTP send failed:', error.message);
      }
    }
    this.devCodeCreateAndLog(normalizedEmail);

    return {
      message: 'Signup successful. Check your email for the verification code (or use the code from server log in dev).',
      user: { id: userRow.id, email: userRow.email ?? normalizedEmail },
      status: 201,
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const userRow = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!userRow) {
      return { error: 'Invalid email or password', status: 401 };
    }

    const match = await bcrypt.compare(password, userRow.passwordHash);
    if (!match) {
      return { error: 'Invalid email or password', status: 401 };
    }

    await this.upsertProfile({ userId: userRow.id, email: userRow.email ?? normalizedEmail });
    const token = this.signToken(userRow.id, userRow.email ?? normalizedEmail);
    return {
      token,
      user: { id: userRow.id, email: userRow.email ?? normalizedEmail },
      status: 200,
    };
  }

  async forgotPassword(_email: string) {
    return {
      message: 'If an account exists, you will receive a password reset email.',
      status: 200,
    };
  }

  async exchangeSupabaseSession(accessToken: string) {
    const result = await this.verifySupabaseAccessToken(accessToken);
    if ('error' in result) {
      return { error: result.error, status: result.status };
    }
    const payload = result.payload;
    const supabaseUserId = payload.sub;
    const email = (payload.email ?? '').trim().toLowerCase();
    if (!supabaseUserId || !email) {
      return { error: 'Invalid token payload', status: 400 };
    }

    let userRow = await this.prisma.user.findFirst({
      where: { supabaseUserId },
      select: { id: true, email: true },
    });

    if (!userRow) {
      userRow = await this.prisma.user.findFirst({
        where: { email },
        select: { id: true, email: true },
      });
      if (userRow) {
        await this.prisma.user.update({
          where: { id: userRow.id },
          data: { supabaseUserId },
        });
      }
    }

    if (!userRow) {
      const placeholderHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), SALT_ROUNDS);
      userRow = await this.prisma.user.create({
        data: { email, passwordHash: placeholderHash, supabaseUserId },
        select: { id: true, email: true },
      });
    }

    await this.upsertProfile({ userId: userRow.id, email: userRow.email ?? email });
    const token = this.signToken(userRow.id, userRow.email ?? email);
    return {
      token,
      user: { id: userRow.id, email: userRow.email ?? email },
      status: 200,
    };
  }

  async supabaseUpdatePassword(accessToken: string, password: string) {
    const result = await this.verifySupabaseAccessToken(accessToken);
    if ('error' in result) {
      const message = result.status === 401 && result.error.toLowerCase().includes('expired')
        ? 'Link expired. Please request a new password reset.'
        : result.error;
      return { error: message, status: result.status };
    }
    const payload = result.payload;
    const supabaseUserId = payload.sub;
    const email = (payload.email ?? '').trim().toLowerCase();
    if (!supabaseUserId) {
      return { error: 'Invalid token payload', status: 400 };
    }
    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters', status: 400 };
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const updated = await this.prisma.user.updateMany({
      where: { supabaseUserId },
      data: { passwordHash },
    });
    if (updated.count > 0) {
      return { ok: true, status: 200 };
    }
    const byEmail = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });
    if (byEmail) {
      await this.prisma.user.update({
        where: { id: byEmail.id },
        data: { passwordHash, supabaseUserId },
      });
      return { ok: true, status: 200 };
    }
    return { error: 'User not found', status: 404 };
  }

  async verifyEmail(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const codeDigits = code.replace(/\D/g, '').slice(0, 8);
    if (!codeDigits) {
      return { error: 'Invalid verification code.', status: 400 };
    }

    // Dev: accept code from console log (in-memory dev code)
    if (this.devCodeVerify(normalizedEmail, codeDigits)) {
      const userRow = await this.prisma.user.findFirst({
        where: { email: normalizedEmail },
        select: { id: true, email: true },
      });
      if (!userRow) {
        return { error: 'User not found', status: 400 };
      }
      const token = this.signToken(userRow.id, userRow.email ?? normalizedEmail);
      return { token, user: { id: userRow.id, email: userRow.email ?? normalizedEmail }, status: 200 };
    }

    if (!env.supabaseUrl || !env.supabaseServiceKey) {
      return { error: 'Email verification is not configured (Supabase).', status: 503 };
    }

    const { data, error } = await this.supabase.getClient().auth.verifyOtp({
      email: normalizedEmail,
      token: codeDigits,
      type: 'email',
    });

    if (error) {
      return {
        error: error.message === 'Token has expired or is invalid' ? 'Invalid or expired verification code. Please request a new code.' : error.message,
        status: 400,
      };
    }
    if (!data?.session?.access_token) {
      return { error: 'Verification failed. No session returned.', status: 400 };
    }

    return this.exchangeSupabaseSession(data.session.access_token);
  }

  async resendVerification(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const userRow = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (!userRow) {
      return { error: 'No account found for this email', status: 400 };
    }
    if (!env.supabaseUrl || !env.supabaseServiceKey) {
      return { error: 'Verification email is not configured (Supabase).', status: 503 };
    }
    const { error } = await this.supabase.getClient().auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });
    if (error) {
      return { error: error.message, status: 400 };
    }
    this.devCodeCreateAndLog(normalizedEmail);
    return { message: 'Verification code sent. Check your email (or server log in dev).', status: 200 };
  }

  getRingCentralAuthUrl(userId: string): { authUrl: string } {
    const state = this.jwtService.sign(
      { userId, nonce: crypto.randomBytes(16).toString('hex') },
      { secret: env.sessionSecret, expiresIn: '10m' },
    );
    const platform = this.ringCentral.getSDK().platform();
    const authUrl = platform.loginUrl({ state, redirectUri: env.ringcentralCallbackUrl });
    return { authUrl };
  }
}
