import { Controller, Get, UseGuards } from '@nestjs/common';
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
    const [profile, members] = await Promise.all([
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
    ]);
    const platformRole = profile?.platformRole ?? 'rep';
    const fullName = profile?.fullName ?? null;
    const avatarUrl = profile?.avatarUrl ?? null;
    const organizationId = profile?.organizationId ?? null;
    const organization = profile?.organization
      ? { id: profile.organization.id, name: profile.organization.name, slug: profile.organization.slug }
      : null;
    const orgs = members.map((m) => ({
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
