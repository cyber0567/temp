import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from './auth';
import type { PlatformRole } from '../types';

const ROLE_ORDER: PlatformRole[] = ['rep', 'admin', 'super_admin'];

function hasRole(userRole: PlatformRole | null | undefined, required: PlatformRole): boolean {
  if (!userRole) return false;
  const userIdx = ROLE_ORDER.indexOf(userRole);
  const reqIdx = ROLE_ORDER.indexOf(required);
  return userIdx >= reqIdx;
}

/** Require user to have at least the given platform role. Fetches platform_role from profiles if not in JWT. */
export function requirePlatformRole(...allowedRoles: PlatformRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    let platformRole = authReq.user?.platformRole as PlatformRole | undefined;

    if (!platformRole) {
      const userId = authReq.user?.sub;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('platform_role')
        .eq('id', userId)
        .single();
      platformRole = (profile?.platform_role as PlatformRole) ?? 'rep';
      if (authReq.user) authReq.user.platformRole = platformRole;
    }

    const ok = allowedRoles.some((r) => hasRole(platformRole, r));
    if (!ok) {
      res.status(403).json({
        error: `Requires platform role: ${allowedRoles.join(' or ')}`,
        yourRole: platformRole,
      });
      return;
    }
    next();
  };
}
