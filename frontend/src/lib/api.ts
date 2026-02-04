const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const API_URL = API_BASE;

export type ApiError = { message: string; code?: string; errors?: Record<string, string> };

export type LoginResponse = { user: { id: string; email: string; name?: string }; token: string };
export type SignupResponse = { user: { id: string; email: string; name?: string }; token: string };
export type ForgotPasswordResponse = { message: string };
export type OAuthAuthResponse = { url: string };

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...init } = options;
  const url = new URL(path.startsWith("http") ? path : `${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
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
};
