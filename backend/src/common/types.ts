export type OrgRole = 'admin' | 'member' | 'viewer';

export type PlatformRole = 'rep' | 'admin' | 'super_admin';

export interface JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  /** Platform role (rep | admin | super_admin). Enforced server-side. */
  platformRole?: PlatformRole;
  /** Primary organization id; null for SUPER_ADMIN. Used for multi-tenant isolation. */
  orgId?: string | null;
  orgRole?: OrgRole;
  exp?: number;
}
