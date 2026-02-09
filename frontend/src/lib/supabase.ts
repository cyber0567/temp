"use client";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Browser Supabase client for Auth (email sign-in, sign-up, reset password). */
export function createClient(): SupabaseClient {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, storage: typeof window !== "undefined" ? window.localStorage : undefined },
  });
}

let browserClient: SupabaseClient | null = null;

/** Singleton for use in api.ts getToken (avoids multiple instances). */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!browserClient) browserClient = createClient();
  return browserClient;
}

/** Current access token (Supabase session or localStorage) for API and WebSocket. */
export async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const supabase = getSupabase();
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
  }
  return localStorage.getItem("token");
}
