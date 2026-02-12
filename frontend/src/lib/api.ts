const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const API_URL = API_BASE;

export type ApiError = { message: string; code?: string; errors?: Record<string, string> };

export type LoginResponse = { user: { id: string; email: string; name?: string }; token: string };
export type SignupResponse = { user: { id: string; email: string; name?: string }; token: string };
export type ForgotPasswordResponse = { message: string };
export type VerifyEmailResponse = { user: { id: string; email: string }; token: string };
export type OAuthAuthResponse = { url: string };

export type OrgRole = "admin" | "member" | "viewer";

/** Platform role: rep (sales rep) < admin (business owner) < super_admin (platform owner) */
export type PlatformRole = "rep" | "admin" | "super_admin";

export type MeResponse = {
  user: {
    id: string;
    email?: string;
    platformRole: PlatformRole;
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
  orgs: { id: string; name: string; slug: string; role: OrgRole }[];
};

export type OrgResponse = { id: string; name: string; slug: string; role?: OrgRole };

async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string>; auth?: boolean } = {}
): Promise<T> {
  const { params, auth, ...init } = options;
  const url = new URL(path.startsWith("http") ? path : `${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (auth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url.toString(), {
    ...init,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = (data as ApiError)?.message
      ? (data as ApiError)
      : { message: (data as { error?: string })?.error ?? `Request failed: ${res.status}` };
    throw err;
  }
  return data as T;
}

export const api = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
  },

  async signup(email: string, password: string, confirmPassword: string): Promise<SignupResponse> {
    return request<SignupResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password, confirmPassword }),
    });
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return request<ForgotPasswordResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: email.trim() }),
    });
  },

  /** Verify email with 8-digit code. Returns token and user on success. */
  async verifyEmail(email: string, code: string): Promise<VerifyEmailResponse> {
    return request<VerifyEmailResponse>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), code }),
    });
  },

  /** Resend 8-digit verification code to email. */
  async resendVerification(email: string): Promise<{ message: string }> {
    return request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email: email.trim() }),
    });
  },

  /** Exchange Supabase access_token (from magic link OTP) for our JWT + user. */
  async exchangeSupabaseSession(accessToken: string): Promise<LoginResponse> {
    return request<LoginResponse>("/auth/supabase-session", {
      method: "POST",
      body: JSON.stringify({ access_token: accessToken }),
    });
  },

  /** Sync new password to backend after Supabase recovery (updateUser). */
  async supabaseUpdatePassword(accessToken: string, password: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>("/auth/supabase-update-password", {
      method: "POST",
      body: JSON.stringify({ access_token: accessToken, password }),
    });
  },

  /** Returns the GitHub OAuth URL (redirect goes to frontend /auth/github/callback). */
  async getGithubAuthUrl(): Promise<OAuthAuthResponse> {
    return request<OAuthAuthResponse>("/auth/github", { method: "GET" });
  },

  /** Exchange GitHub OAuth code for user/token (callback page). */
  async exchangeGithubCode(code: string, redirectUri?: string): Promise<LoginResponse> {
    return request<LoginResponse>("/auth/github/callback", {
      method: "POST",
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });
  },

  /** Returns the Google OAuth URL (redirect goes to frontend /auth/google/callback). */
  async getGoogleAuthUrl(): Promise<OAuthAuthResponse> {
    return request<OAuthAuthResponse>("/auth/google", { method: "GET" });
  },

  /** Exchange Google OAuth code for user/token (callback page). */
  async exchangeGoogleCode(code: string, redirectUri?: string): Promise<LoginResponse> {
    return request<LoginResponse>("/auth/google/exchange", {
      method: "POST",
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });
  },

  /** Get current user and orgs (requires auth). */
  async getMe(): Promise<MeResponse> {
    return request<MeResponse>("/me", { auth: true });
  },

  /** List organizations (requires auth). */
  async getOrgs(): Promise<{ orgs: OrgResponse[] }> {
    return request<{ orgs: OrgResponse[] }>("/orgs", { auth: true });
  },

  /** Create organization (requires auth). */
  async createOrg(name: string): Promise<{ org: OrgResponse }> {
    return request<{ org: OrgResponse }>("/orgs", {
      method: "POST",
      body: JSON.stringify({ name }),
      auth: true,
    });
  },

  /** List org members (org admin only). */
  async getOrgMembers(orgId: string): Promise<{ members: { user_id: string; role: OrgRole; created_at: string }[] }> {
    return request(`/orgs/${orgId}/members`, { auth: true });
  },

  /** Add member to org (org admin only). */
  async addOrgMember(orgId: string, userId: string, role?: OrgRole): Promise<{ member: { user_id: string; role: string } }> {
    return request(`/orgs/${orgId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId, role: role ?? "member" }),
      auth: true,
    });
  },

  /** Update org member role (org admin only). */
  async updateOrgMemberRole(orgId: string, userId: string, role: OrgRole): Promise<{ ok: boolean }> {
    return request(`/orgs/${orgId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
      auth: true,
    });
  },

  /** Remove member from org (org admin or self). */
  async removeOrgMember(orgId: string, userId: string): Promise<{ ok: boolean }> {
    return request(`/orgs/${orgId}/members/${userId}`, {
      method: "DELETE",
      auth: true,
    });
  },

  /** Get RingCentral OAuth URL to redirect user (requires auth). */
  async getRingCentralAuthUrl(): Promise<{ authUrl: string }> {
    return request<{ authUrl: string }>("/auth/ringcentral", {
      method: "POST",
      auth: true,
    });
  },

  /** Check if RingCentral is connected (requires auth). */
  async getRingCentralStatus(): Promise<{ connected: boolean }> {
    return request<{ connected: boolean }>("/auth/ringcentral/status", { auth: true });
  },

  /** Disconnect RingCentral (remove stored tokens). Requires auth. */
  async disconnectRingCentral(): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>("/auth/ringcentral", {
      method: "DELETE",
      auth: true,
    });
  },

  /** Set user platform role (super_admin only). */
  async setUserPlatformRole(userId: string, platformRole: PlatformRole): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/admin/users/${userId}/platform-role`, {
      method: "PATCH",
      body: JSON.stringify({ platformRole }),
      auth: true,
    });
  },

  /** List all users (super_admin only). */
  async getAdminUsers(): Promise<{
    users: { id: string; email?: string; full_name?: string; platform_role: PlatformRole; provider?: string }[];
  }> {
    return request(`/admin/users`, { auth: true });
  },

  /** Get all settings (profile, notifications, organization, compliance, quality). */
  async getSettings(orgId?: string): Promise<SettingsResponse> {
    const url = orgId ? `/settings?orgId=${encodeURIComponent(orgId)}` : "/settings";
    return request<SettingsResponse>(url, { auth: true });
  },

  /** Save settings (profile, notifications, and/or organization/compliance/quality). */
  async saveSettings(payload: SaveSettingsPayload): Promise<SettingsResponse> {
    return request<SettingsResponse>("/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
      auth: true,
    });
  },
};

export type SettingsResponse = {
  profile: { fullName: string | null; timezone: string; currency: string; avatarUrl: string | null };
  notifications: {
    emailAlerts: boolean;
    flaggedCalls: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
  organization: {
    id: string;
    name: string;
    industry: string;
    companySize: string;
  } | null;
  compliance: {
    autoReview: boolean;
    requireDisclosure: boolean;
    autoFlagThreshold: number;
  } | null;
  quality: {
    minQaScore: number;
    autoApproveThreshold: number;
    enableEscalation: boolean;
  } | null;
  orgId: string | null;
};

export type SaveSettingsPayload = {
  profile?: { fullName?: string; timezone?: string; currency?: string; avatarUrl?: string | null };
  notifications?: {
    emailAlerts?: boolean;
    flaggedCalls?: boolean;
    dailyDigest?: boolean;
    weeklyReport?: boolean;
  };
  organization?: { orgId: string; name?: string; industry?: string; companySize?: string };
  compliance?: { autoReview?: boolean; requireDisclosure?: boolean; autoFlagThreshold?: number };
  quality?: { minQaScore?: number; autoApproveThreshold?: number; enableEscalation?: boolean };
};
