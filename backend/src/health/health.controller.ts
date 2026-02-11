import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { SupabaseService } from '../config/supabase.service';

@Controller()
export class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get('health')
  health() {
    return { ok: true, timestamp: new Date().toISOString() };
  }

  @Get('db-check')
  async dbCheck(@Res() res: Response) {
    try {
      const [usersRes, profilesRes] = await Promise.all([
        this.supabase.getClient().from('users').select('id').limit(1),
        this.supabase.getClient().from('profiles').select('id').limit(1),
      ]);
      const usersOk = usersRes.error === null;
      const profilesOk = profilesRes.error === null;
      const ok = usersOk && profilesOk;
      const body = {
        ok,
        database: 'Supabase (hosted PostgreSQL)',
        tables: {
          users: usersOk ? 'ok' : (usersRes.error?.message ?? 'missing or inaccessible'),
          profiles: profilesOk ? 'ok' : (profilesRes.error?.message ?? 'missing or inaccessible'),
        },
        hint: !ok
          ? 'Create a Supabase project at supabase.com, run migrations in SQL Editor (001, 002, 003), set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
          : undefined,
      };
      return res.status(ok ? 200 : 503).json(body);
    } catch (e) {
      return res.status(503).json({
        ok: false,
        error: e instanceof Error ? e.message : 'Database check failed',
        hint: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env and run migrations in Supabase SQL Editor.',
      });
    }
  }
}
