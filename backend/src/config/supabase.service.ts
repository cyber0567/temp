import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient | null = null;

  getClient(): SupabaseClient {
    if (!this.client) {
      if (!env.supabaseUrl || !env.supabaseServiceKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
      }
      this.client = createClient(env.supabaseUrl, env.supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return this.client;
  }
}
