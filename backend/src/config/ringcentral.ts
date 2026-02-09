import { SDK } from '@ringcentral/sdk';
import { env } from './env';
import { supabase } from './supabase';

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // refresh if expires in < 5 min

/** RingCentral SDK instance for OAuth and API calls. */
export function getRingCentralSDK() {
  if (!env.ringcentralClientId || !env.ringcentralClientSecret || !env.ringcentralCallbackUrl) {
    throw new Error('RingCentral OAuth is not configured. Set RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_CALLBACK_URL.');
  }
  const server = env.ringcentralServer.includes('devtest') ? SDK.server.sandbox : SDK.server.production;
  return new SDK({
    server,
    clientId: env.ringcentralClientId,
    clientSecret: env.ringcentralClientSecret,
    redirectUri: env.ringcentralCallbackUrl,
  });
}

export function isRingCentralConfigured(): boolean {
  return !!(env.ringcentralClientId && env.ringcentralClientSecret && env.ringcentralCallbackUrl);
}

/** Returns env var names that are missing or empty (for 503 debugging). */
export function getRingCentralMissingEnv(): string[] {
  const missing: string[] = [];
  if (!env.ringcentralClientId?.trim()) missing.push('RINGCENTRAL_CLIENT_ID');
  if (!env.ringcentralClientSecret?.trim()) missing.push('RINGCENTRAL_CLIENT_SECRET');
  if (!env.ringcentralCallbackUrl?.trim()) missing.push('RINGCENTRAL_CALLBACK_URL');
  return missing;
}

/** Token endpoint for refresh (guide: grant_type=refresh_token). */
function getTokenUrl(): string {
  const base = env.ringcentralServer.replace(/\/$/, '');
  return `${base}/restapi/oauth/token`;
}

/**
 * Get a valid RingCentral access token for the user, refreshing if expired or expiring soon.
 * Use this before making RingCentral API calls.
 */
export async function getValidRingCentralAccessToken(userId: string): Promise<string | null> {
  const { data: row } = await supabase
    .from('ringcentral_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();
  if (!row?.access_token || !row?.refresh_token) return null;
  const expiresAt = new Date(row.expires_at).getTime();
  const now = Date.now();
  if (expiresAt - now > TOKEN_EXPIRY_BUFFER_MS) {
    return row.access_token;
  }
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: row.refresh_token,
    client_id: env.ringcentralClientId,
    client_secret: env.ringcentralClientSecret,
  });
  const res = await fetch(getTokenUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('RingCentral token refresh failed:', err);
    return null;
  }
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token ?? row.refresh_token;
  const expiresIn = data.expires_in ?? 3600;
  const newExpiresAt = new Date(now + expiresIn * 1000).toISOString();
  await supabase
    .from('ringcentral_tokens')
    .upsert(
      {
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  return accessToken ?? null;
}
