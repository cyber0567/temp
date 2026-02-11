import { Injectable } from '@nestjs/common';
import { SDK } from '@ringcentral/sdk';
import { env } from './env';
import { SupabaseService } from './supabase.service';

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

@Injectable()
export class RingCentralService {
  private sdk: SDK | null = null;

  constructor(private readonly supabase: SupabaseService) {}

  getSDK(): SDK {
    if (!this.sdk) {
      if (!env.ringcentralClientId || !env.ringcentralClientSecret || !env.ringcentralCallbackUrl) {
        throw new Error(
          'RingCentral OAuth is not configured. Set RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_CALLBACK_URL.',
        );
      }
      const server = env.ringcentralServer.includes('devtest') ? SDK.server.sandbox : SDK.server.production;
      this.sdk = new SDK({
        server,
        clientId: env.ringcentralClientId,
        clientSecret: env.ringcentralClientSecret,
        redirectUri: env.ringcentralCallbackUrl,
      });
    }
    return this.sdk;
  }

  isConfigured(): boolean {
    return !!(env.ringcentralClientId && env.ringcentralClientSecret && env.ringcentralCallbackUrl);
  }

  getMissingEnv(): string[] {
    const missing: string[] = [];
    if (!env.ringcentralClientId?.trim()) missing.push('RINGCENTRAL_CLIENT_ID');
    if (!env.ringcentralClientSecret?.trim()) missing.push('RINGCENTRAL_CLIENT_SECRET');
    if (!env.ringcentralCallbackUrl?.trim()) missing.push('RINGCENTRAL_CALLBACK_URL');
    return missing;
  }

  async getValidAccessToken(userId: string): Promise<string | null> {
    const supabase = this.supabase.getClient();
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
    const base = env.ringcentralServer.replace(/\/$/, '');
    const res = await fetch(`${base}/restapi/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: row.refresh_token,
        client_id: env.ringcentralClientId,
        client_secret: env.ringcentralClientSecret,
      }).toString(),
    });
    if (!res.ok) {
      console.error('RingCentral token refresh failed:', await res.text());
      return null;
    }
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    const newExpiresAt = new Date(now + (data.expires_in ?? 3600) * 1000).toISOString();
    await supabase.from('ringcentral_tokens').upsert(
      {
        user_id: userId,
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? row.refresh_token,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    return data.access_token ?? null;
  }
}
