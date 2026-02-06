export type OrgRole = 'admin' | 'member' | 'viewer';

/** Platform role: rep (sales rep) < admin (business owner) < super_admin (platform owner) */
export type PlatformRole = 'rep' | 'admin' | 'super_admin';

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  platformRole?: PlatformRole;
}

export interface OrgMember {
  orgId: string;
  userId: string;
  role: OrgRole;
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
  platformRole?: PlatformRole;
  orgId?: string;
  orgRole?: OrgRole;
  exp?: number;
}
