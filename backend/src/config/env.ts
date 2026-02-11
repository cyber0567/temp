const raw = {
  port: process.env.PORT ?? '3001',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
  frontendUrl: process.env.FRONTEND_URL ?? '',
  apiBaseUrl: process.env.API_BASE_URL ?? '',
  sessionSecret: process.env.SESSION_SECRET ?? '',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleCallbackUrl: process.env.CALLBACK_URL ?? '',
  ringcentralClientId: process.env.RINGCENTRAL_CLIENT_ID ?? '',
  ringcentralClientSecret: process.env.RINGCENTRAL_CLIENT_SECRET ?? '',
  ringcentralServer: process.env.RINGCENTRAL_SERVER ?? 'https://platform.ringcentral.com',
  ringcentralCallbackUrl: process.env.RINGCENTRAL_CALLBACK_URL ?? '',
};

export const env = {
  port: parseInt(raw.port, 10),
  nodeEnv: raw.nodeEnv,
  databaseUrl: raw.databaseUrl,
  supabaseUrl: raw.supabaseUrl,
  supabaseServiceKey: raw.supabaseServiceKey,
  supabaseAnonKey: raw.supabaseAnonKey,
  supabaseJwtSecret: raw.supabaseJwtSecret,
  frontendUrl: raw.frontendUrl,
  apiBaseUrl: raw.apiBaseUrl,
  sessionSecret: (() => {
    if (raw.sessionSecret) return raw.sessionSecret;
    if (raw.nodeEnv === 'production') {
      throw new Error('SESSION_SECRET must be set in .env when NODE_ENV=production');
    }
    return 'dev-session-secret-do-not-use-in-production';
  })(),
  googleClientId: raw.googleClientId,
  googleClientSecret: raw.googleClientSecret,
  googleCallbackUrl: raw.googleCallbackUrl,
  ringcentralClientId: raw.ringcentralClientId,
  ringcentralClientSecret: raw.ringcentralClientSecret,
  ringcentralServer: raw.ringcentralServer,
  ringcentralCallbackUrl: (raw.ringcentralCallbackUrl || '').trim().replace(/\/+$/, '') || '',
};
