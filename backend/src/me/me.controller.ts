import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../config/supabase.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JWTPayload } from '../common/types';
import { OrgRole } from '../common/types';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  @Get()
  async getMe(@CurrentUser() user: JWTPayload) {
    const userId = user?.sub;
    if (!userId) {
      return { user: null, orgs: [] };
    }
    const [profile, { data: members }] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { id: userId },
        select: { platformRole: true, fullName: true, avatarUrl: true },
      }),
      this.supabase.getClient().from('organization_members').select('org_id, role').eq('user_id', userId),
    ]);
    const platformRole = profile?.platformRole ?? 'rep';
    const fullName = profile?.fullName ?? null;
    const avatarUrl = profile?.avatarUrl ?? null;
    const orgIds = (members ?? []).map((m) => m.org_id);
    let orgs: { id: string; name: string; slug: string; role: string }[] = [];
    if (orgIds.length > 0) {
      const { data: orgRows } = await this.supabase
        .getClient()
        .from('organizations')
        .select('id, name, slug')
        .in('id', orgIds);
      const roleByOrg = new Map((members ?? []).map((m) => [m.org_id, m.role as OrgRole]));
      orgs = (orgRows ?? []).map((o) => ({ ...o, role: roleByOrg.get(o.id) ?? 'member' }));
    }
    return {
      user: {
        id: user.sub,
        email: user.email,
        platformRole: String(platformRole),
        fullName,
        avatarUrl,
      },
      orgs,
    };
  }
}
