export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export interface SignUpBody {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
}
