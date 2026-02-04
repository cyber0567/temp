import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { supabase } from './supabase';

export interface PassportUser {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  provider: string;
}

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as PassportUser).id);
});

passport.deserializeUser((id: string, done) => {
  done(null, { id });
});

// Must match Google Console "Authorized redirect URI" exactly (no trailing slash).
// Add this EXACT string in Google Cloud Console → APIs & Services → Credentials → your OAuth client → Authorized redirect URIs.
export const googleCallbackUrl =
  (env.googleCallbackUrl && env.googleCallbackUrl.trim()) || `http://localhost:${env.port}/auth/google/callback`;

if (env.googleClientId && env.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: googleCallbackUrl,
        passReqToCallback: true,
      },
      async (_req, _accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? '';
          const displayName = profile.displayName ?? '';
          const givenName = profile.name?.givenName ?? '';
          const familyName = profile.name?.familyName ?? '';
          const picture = profile.photos?.[0]?.value ?? null;
          const id = `google-${profile.id}`;

          await supabase.from('profiles').upsert(
            {
              id,
              email,
              full_name: displayName || null,
              avatar_url: picture,
              provider: 'google',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

          const user: PassportUser = {
            id,
            email,
            displayName,
            firstName: givenName,
            lastName: familyName,
            picture: picture ?? undefined,
            provider: 'google',
          };
          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}
