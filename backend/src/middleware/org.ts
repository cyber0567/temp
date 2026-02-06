import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from './auth';
import type { OrgRole } from '../types';

/** Require user to be a member of org with at least one of the given roles. */
export function requireOrgRole(...allowedRoles: OrgRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const orgId = req.params.orgId ?? req.body?.orgId ?? req.query?.orgId;
    if (!orgId || typeof orgId !== 'string') {
      res.status(400).json({ error: 'Organization ID required' });
      return;
    }
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { data: member, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();
    if (error || !member) {
      res.status(403).json({ error: 'Not a member of this organization' });
      return;
    }
    const role = member.role as OrgRole;
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      res.status(403).json({ error: `Requires one of: ${allowedRoles.join(', ')}` });
      return;
    }
    (req as AuthenticatedRequest & { orgId: string; orgRole: OrgRole }).orgId = orgId;
    (req as AuthenticatedRequest & { orgId: string; orgRole: OrgRole }).orgRole = role;
    next();
  };
}
