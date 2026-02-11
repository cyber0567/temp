import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';

export interface PassportUser {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  provider: string;
}

/** Placeholder hash for OAuth-only users (they never use password login). */
const OAUTH_PLACEHOLDER_HASH =
  '$2b$10$oauth.placeholder.hash.do.not.use.for.login';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly prisma: PrismaService) {
    const callbackUrl =
      (env.googleCallbackUrl && env.googleCallbackUrl.trim()) ||
      `http://localhost:${env.port}/auth/google/callback`;
    super({
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: callbackUrl,
      scope: ['profile', 'email'],
      passReqToCallback: true,
    });
  }

  async validate(
    _request: unknown,
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; emails?: { value: string }[]; displayName?: string; name?: { givenName?: string; familyName?: string }; photos?: { value: string }[] },
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const email = (profile.emails?.[0]?.value ?? '').trim().toLowerCase();
      if (!email) {
        done(new Error('Google account has no email') as Error, undefined);
        return;
      }
      const displayName = profile.displayName ?? '';
      const givenName = profile.name?.givenName ?? '';
      const familyName = profile.name?.familyName ?? '';
      const fullName = displayName || [givenName, familyName].filter(Boolean).join(' ') || null;
      const picture = profile.photos?.[0]?.value ?? null;

      // 1. Find or create user (uses DATABASE_URL – same as migrations – avoids Supabase API key permission issues)
      let userRow = await this.prisma.user.findFirst({ where: { email }, select: { id: true, email: true } });
      if (!userRow) {
        userRow = await this.prisma.user.create({
          data: { email, passwordHash: OAUTH_PLACEHOLDER_HASH },
          select: { id: true, email: true },
        });
      }

      const userId = userRow.id;

      // 2. Upsert profile with all Google user info
      await this.prisma.profile.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email,
          fullName,
          avatarUrl: picture,
          provider: 'google',
        },
        update: {
          email,
          fullName,
          avatarUrl: picture,
          provider: 'google',
        },
      });

      // 3. Remove legacy profile row if it existed with google-xxx id
      const legacyProfileId = `google-${profile.id}`;
      if (legacyProfileId !== userId) {
        await this.prisma.profile.deleteMany({ where: { id: legacyProfileId } });
      }

      const user: PassportUser = {
        id: userId,
        email: userRow.email ?? email,
        displayName,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        picture: picture ?? undefined,
        provider: 'google',
      };
      done(null, user);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}
