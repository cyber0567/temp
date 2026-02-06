import { Router, Response, Request } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requirePlatformRole } from '../middleware/platform-role';
import type { PlatformRole } from '../types';

const router = Router();

/** PATCH /admin/users/:userId/platform-role - set user's platform role (super_admin only) */
router.patch(
  '/users/:userId/platform-role',
  requireAuth,
  requirePlatformRole('super_admin'),
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { platformRole } = req.body as { platformRole?: PlatformRole };
    const valid: PlatformRole[] = ['rep', 'admin', 'super_admin'];
    if (!platformRole || !valid.includes(platformRole)) {
      res.status(400).json({ error: 'platformRole must be rep, admin, or super_admin' });
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ platform_role: platformRole, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ ok: true, platformRole });
  }
);

/** GET /admin/users - list all users (super_admin only, for platform-wide management) */
router.get(
  '/users',
  requireAuth,
  requirePlatformRole('super_admin'),
  async (req: Request, res: Response): Promise<void> => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, platform_role, provider')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ users: profiles ?? [] });
  }
);

export default router;
