import { Router, Response, Request } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireOrgRole } from '../middleware/org';
import type { OrgRole } from '../types';

const router = Router();

/** GET /orgs - list organizations the user is a member of */
router.get('/', requireAuth, async (req, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select('org_id, role')
    .eq('user_id', userId);
  if (membersError) {
    res.status(500).json({ error: membersError.message });
    return;
  }
  const orgIds = (members ?? []).map((m) => m.org_id);
  if (orgIds.length === 0) {
    res.json({ orgs: [] });
    return;
  }
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .in('id', orgIds);
  if (orgsError) {
    res.status(500).json({ error: orgsError.message });
    return;
  }
  const roleByOrg = new Map((members ?? []).map((m) => [m.org_id, m.role as OrgRole]));
  const orgsWithRoles = (orgs ?? []).map((o) => ({
    ...o,
    role: roleByOrg.get(o.id),
  }));
  res.json({ orgs: orgsWithRoles });
});

/** POST /orgs - create organization (auth required) */
router.post('/', requireAuth, async (req, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const { name } = req.body as { name?: string };
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Organization name is required' });
    return;
  }
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!slug) {
    res.status(400).json({ error: 'Invalid organization name' });
    return;
  }
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name, slug })
    .select('id, name, slug')
    .single();
  if (orgError) {
    if (orgError.code === '23505') res.status(400).json({ error: 'Organization slug already exists' });
    else res.status(500).json({ error: orgError.message });
    return;
  }
  const { error: memberError } = await supabase.from('organization_members').insert({
    org_id: org.id,
    user_id: userId,
    role: 'admin',
  });
  if (memberError) {
    res.status(500).json({ error: memberError.message });
    return;
  }
  res.status(201).json({ org: { ...org, role: 'admin' as OrgRole } });
});

/** GET /orgs/:orgId/members - list members (admin only) */
router.get('/:orgId/members', requireAuth, requireOrgRole('admin'), async (req: Request, res: Response): Promise<void> => {
  const orgId = (req as AuthenticatedRequest & { orgId: string }).orgId;
  const { data, error } = await supabase
    .from('organization_members')
    .select('user_id, role, created_at')
    .eq('org_id', orgId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ members: data ?? [] });
});

/** POST /orgs/:orgId/members - add member (admin only) */
router.post('/:orgId/members', requireAuth, requireOrgRole('admin'), async (req: Request, res: Response): Promise<void> => {
  const orgId = (req as AuthenticatedRequest & { orgId: string }).orgId;
  const { userId, role } = req.body as { userId?: string; role?: OrgRole };
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  const validRoles: OrgRole[] = ['admin', 'member', 'viewer'];
  const r = role && validRoles.includes(role) ? role : 'member';
  const { data, error } = await supabase
    .from('organization_members')
    .insert({ org_id: orgId, user_id: userId, role: r })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') res.status(400).json({ error: 'User is already a member' });
    else res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ member: data });
});

/** PATCH /orgs/:orgId/members/:userId - update role (admin only) */
router.patch('/:orgId/members/:userId', requireAuth, requireOrgRole('admin'), async (req: Request, res: Response): Promise<void> => {
  const orgId = (req as AuthenticatedRequest & { orgId: string }).orgId;
  const { userId } = req.params;
  const { role } = req.body as { role?: OrgRole };
  const validRoles: OrgRole[] = ['admin', 'member', 'viewer'];
  if (!role || !validRoles.includes(role)) {
    res.status(400).json({ error: 'Valid role (admin, member, viewer) is required' });
    return;
  }
  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('org_id', orgId)
    .eq('user_id', userId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ ok: true });
});

/** DELETE /orgs/:orgId/members/:userId - remove member (admin or self) */
router.delete('/:orgId/members/:userId', requireAuth, async (req, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest & { orgId?: string; orgRole?: OrgRole };
  const orgId = req.params.orgId;
  const targetUserId = req.params.userId;
  const currentUserId = authReq.user?.sub;
  if (!currentUserId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const isSelf = targetUserId === currentUserId;
  if (!isSelf) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', currentUserId)
      .single();
    if (!member || (member.role as string) !== 'admin') {
      res.status(403).json({ error: 'Only admins can remove other members' });
      return;
    }
  }
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', targetUserId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ ok: true });
});

export default router;
