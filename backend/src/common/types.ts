export type OrgRole = 'admin' | 'member' | 'viewer';

export type PlatformRole = 'rep' | 'admin' | 'super_admin';

export interface JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  platformRole?: PlatformRole;
  orgId?: string;
  orgRole?: OrgRole;
  exp?: number;
}
