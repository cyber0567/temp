import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RingCentralService } from '../config/ringcentral.service';
import { SupabaseService } from '../config/supabase.service';
import { EmailService } from '../email/email.service';
import { env } from '../config/env';
import type { PlatformRole } from '../common/types';

const SALT_ROUNDS = 10;
const DEV_CODE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const INVITE_EXPIRY_DAYS = 7;

@Injectable()
export class AuthService {
  // Dev-only: in-memory codes so you can use the code from console log (Supabase never gives us the OTP).
  private static devVerificationCodes = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly ringCentral: RingCentralService,
    private readonly emailService: EmailService,
  ) {}

  /** JWT must include role + orgId for RBAC and multi-tenant isolation. */
  signToken(
    userId: string,
    email: string,
    platformRole?: PlatformRole,
    organizationId?: string | null,
  ): string {
    return this.jwtService.sign(
      { sub: userId, email, platformRole, orgId: organizationId ?? null },
      { secret: env.sessionSecret, expiresIn: '7d' },
    );
  }

  /** Returns error if user is deactivated; otherwise null. Public for use in OAuth callbacks. */
  async getDeactivatedError(userId: string): Promise<{ error: string; status: number } | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { active: true },
    });
    if (profile?.active === false) {
      return {
        error: 'Your account has been deactivated. Please contact SWP super admin',
        status: 403,
      };
    }
    return null;
  }

  /** Minimal user payload for OAuth redirect URL (id, email, platformRole) so frontend can redirect to role dashboard. */
  async getOAuthRedirectUser(userId: string, email: string): Promise<{ id: string; email: string; platformRole: string }> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { platformRole: true },
    });
    return {
      id: userId,
      email: email ?? '',
      platformRole: (profile?.platformRole as string) ?? 'rep',
    };
  }

  /** Build user payload for auth responses (login, exchange, verify). Matches /me shape. */
  private async getAuthUserPayload(userId: string, email: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { platformRole: true, fullName: true, avatarUrl: true, organizationId: true },
    });
    return {
      id: userId,
      email,
      platformRole: profile?.platformRole ?? 'rep',
      fullName: profile?.fullName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      organizationId: profile?.organizationId ?? null,
    };
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
        // Only overwrite profile fields when explicitly provided (e.g. OAuth); do not clear on login
        ...(params.fullName !== undefined && { fullName: params.fullName ?? null }),
        ...(params.avatarUrl !== undefined && { avatarUrl: params.avatarUrl ?? null }),
        ...(params.provider !== undefined && { provider: params.provider ?? null }),
      },
    });
  }

  /** Generate URL-safe slug from name; ensure unique by appending suffix if needed. */
  private async uniqueOrgSlug(name: string): Promise<string> {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 60) || 'org';
    let slug = base;
    let n = 0;
    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      slug = `${base}-${++n}`;
    }
    return slug;
  }

  async signup(email: string, password: string, confirmPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    let userRow: { id: string; email: string };
    try {
      const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: { email: normalizedEmail, passwordHash },
          select: { id: true, email: true },
        });
        await tx.profile.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            email: user.email ?? normalizedEmail,
            platformRole: 'rep',
            organizationId: null,
          },
          update: {
            email: user.email ?? normalizedEmail,
            platformRole: 'rep',
            organizationId: null,
          },
        });
        return { user };
      });
      userRow = result.user;
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'P2002') {
        return { error: 'An account with this email already exists', status: 400 };
      }
      return { error: err.message ?? 'Signup failed', status: 400 };
    }

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

    const activeError = await this.getDeactivatedError(userRow.id);
    if (activeError) return activeError;

    await this.upsertProfile({ userId: userRow.id, email: userRow.email ?? normalizedEmail });
    const user = await this.getAuthUserPayload(userRow.id, userRow.email ?? normalizedEmail);
    const token = this.signToken(
      userRow.id,
      userRow.email ?? normalizedEmail,
      user.platformRole,
      user.organizationId,
    );
    return { token, user, status: 200 };
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

    const activeError = await this.getDeactivatedError(userRow.id);
    if (activeError) return activeError;
    await this.upsertProfile({ userId: userRow.id, email: userRow.email ?? email });
    const user = await this.getAuthUserPayload(userRow.id, userRow.email ?? email);
    const token = this.signToken(
      userRow.id,
      userRow.email ?? email,
      user.platformRole,
      user.organizationId,
    );
    return { token, user, status: 200 };
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
      const activeError = await this.getDeactivatedError(userRow.id);
      if (activeError) return activeError;
      const user = await this.getAuthUserPayload(userRow.id, userRow.email ?? normalizedEmail);
      const token = this.signToken(
        userRow.id,
        userRow.email ?? normalizedEmail,
        user.platformRole,
        user.organizationId,
      );
      return { token, user, status: 200 };
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

  /** Admin invites a user (role USER) to their org. Creates invitation and sends email. */
  async inviteUser(invitedByUserId: string, email: string, orgId: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { error: 'Valid email is required', status: 400 };
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      return { error: 'A user with this email already exists', status: 400 };
    }
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });
    if (!org) {
      return { error: 'Organization not found', status: 404 };
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const prisma = this.prisma as unknown as import('@prisma/client').PrismaClient;
    await prisma.invitation.create({
      data: {
        email: normalizedEmail,
        orgId,
        invitedBy: invitedByUserId,
        token,
        expiresAt,
      },
    });
    const baseUrl = (env.frontendUrl || '').replace(/\/+$/, '') || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/accept-invite?token=${encodeURIComponent(token)}`;
    await this.emailService.sendInviteLink(normalizedEmail, inviteLink);
    return {
      message: 'Invitation sent. In development the link is also logged.',
      inviteLink: env.nodeEnv === 'development' ? inviteLink : undefined,
      status: 201,
    };
  }

  /** Accept invitation: set password and create account (role USER) in the invited org. */
  async acceptInvite(token: string, password: string) {
    const prisma = this.prisma as unknown as import('@prisma/client').PrismaClient;
    const invite = await prisma.invitation.findFirst({
      where: { token },
      select: { id: true, email: true, orgId: true, expiresAt: true },
    });
    if (!invite) {
      return { error: 'Invalid or expired invitation link', status: 400 };
    }
    if (invite.expiresAt < new Date()) {
      await prisma.invitation.deleteMany({ where: { token } });
      return { error: 'Invitation has expired', status: 400 };
    }
    const normalizedEmail = invite.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      return { error: 'An account with this email already exists. Sign in instead.', status: 400 };
    }
    if (!password || password.length < 6) {
      return { error: 'Password must be at least 6 characters', status: 400 };
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userRow = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: { email: normalizedEmail, passwordHash },
        select: { id: true, email: true },
      });
      await tx.profile.create({
        data: {
          id: user.id,
          email: user.email ?? normalizedEmail,
          platformRole: 'rep',
          organizationId: invite.orgId,
        },
      });
      await tx.organizationMember.create({
        data: { orgId: invite.orgId, userId: user.id, role: 'member' },
      });
      await tx.invitation.delete({ where: { id: invite.id } });
      return user;
    });
    const user = await this.getAuthUserPayload(userRow.id, userRow.email ?? normalizedEmail);
    const jwt = this.signToken(
      userRow.id,
      userRow.email ?? normalizedEmail,
      user.platformRole,
      user.organizationId,
    );
    return { token: jwt, user, status: 200 };
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
