import { Controller, Get, UseGuards } from '@nestjs/common';
import type { Organization } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JWTPayload } from '../common/types';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getMe(@CurrentUser() user: JWTPayload) {
    const userId = user?.sub;
    if (!userId) {
      return { user: null, orgs: [] };
    }
    const [profile, members, allOrgs] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { id: userId },
        select: {
          platformRole: true,
          fullName: true,
          avatarUrl: true,
          organizationId: true,
          organization: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.organizationMember.findMany({
        where: { userId },
        select: { orgId: true, role: true, org: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.organization.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
    ]);
    const platformRole = profile?.platformRole ?? 'rep';
    const fullName = profile?.fullName ?? null;
    const avatarUrl = profile?.avatarUrl ?? null;
    const organizationId = profile?.organizationId ?? null;
    const organization = profile?.organization
      ? { id: profile.organization.id, name: profile.organization.name, slug: profile.organization.slug }
      : null;
    type OrgRow = Pick<Organization, 'id' | 'name' | 'slug'>;
    type MemberRow = { org: { id: string; name: string; slug: string }; role: string };
    const orgs =
      platformRole === 'super_admin'
        ? (allOrgs as OrgRow[]).map((o: OrgRow) => ({ id: o.id, name: o.name, slug: o.slug, role: 'admin' as const }))
        : (members as MemberRow[]).map((m: MemberRow) => ({
            id: m.org.id,
            name: m.org.name,
            slug: m.org.slug,
            role: m.role,
          }));
    return {
      user: {
        id: user.sub,
        email: user.email,
        platformRole: String(platformRole),
        fullName,
        avatarUrl,
        organizationId,
        organization,
      },
      orgs,
    };
  }
}
