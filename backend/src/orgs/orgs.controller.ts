import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgRoleGuard } from '../common/guards/org-role.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { OrgRoles } from '../common/decorators/org-roles.decorator';
import { JWTPayload } from '../common/types';
import { OrgRole } from '../common/types';

@Controller('orgs')
@UseGuards(JwtAuthGuard)
export class OrgsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: JWTPayload) {
    const userId = user?.sub;
    if (!userId) return { orgs: [] };
    const members = await this.prisma.organizationMember.findMany({
      where: { userId },
      select: { orgId: true, role: true, org: { select: { id: true, name: true, slug: true } } },
    });
    return {
      orgs: members.map((m) => ({ id: m.org.id, name: m.org.name, slug: m.org.slug, role: m.role })),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: JWTPayload, @Body('name') name: string) {
    const userId = user?.sub;
    if (!userId) throw new ForbiddenException('Authentication required');
    if (!name || typeof name !== 'string') {
      throw new BadRequestException('Organization name is required');
    }
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) throw new BadRequestException('Invalid organization name');
    try {
      const [org] = await this.prisma.$transaction([
        this.prisma.organization.create({ data: { name, slug }, select: { id: true, name: true, slug: true } }),
      ]);
      await this.prisma.organizationMember.create({
        data: { orgId: org.id, userId, role: 'admin' },
      });
      return { org: { ...org, role: 'admin' as OrgRole } };
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === 'P2002') throw new BadRequestException('Organization slug already exists');
      throw new BadRequestException(err instanceof Error ? err.message : 'Failed to create organization');
    }
  }

  @Get(':orgId/members')
  @UseGuards(OrgRoleGuard)
  @OrgRoles('admin')
  async listMembers(@Param('orgId') orgId: string) {
    const members = await this.prisma.organizationMember.findMany({
      where: { orgId },
      select: { userId: true, role: true, createdAt: true },
    });
    const userIds = members.map((m) => m.userId);
    const profiles = userIds.length
      ? await this.prisma.profile.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, fullName: true },
        })
      : [];
    const profileByUserId = new Map(profiles.map((p) => [p.id, p]));
    return {
      members: members.map((m) => {
        const profile = profileByUserId.get(m.userId);
        return {
          user_id: m.userId,
          email: profile?.email ?? null,
          full_name: profile?.fullName ?? null,
          role: m.role,
          created_at: m.createdAt.toISOString(),
        };
      }),
    };
  }

  @Post(':orgId/members')
  @UseGuards(OrgRoleGuard)
  @OrgRoles('admin')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('orgId') orgId: string,
    @Body('userId') userId: string | undefined,
    @Body('email') email: string | undefined,
    @Body('role') role: OrgRole | undefined,
  ) {
    let resolvedUserId = (userId ?? '').trim();
    if (!resolvedUserId && (email ?? '').trim()) {
      const normalizedEmail = (email as string).trim().toLowerCase();
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (!user) throw new BadRequestException('No user found with this email');
      resolvedUserId = user.id;
    }
    if (!resolvedUserId) {
      throw new BadRequestException('userId or email is required');
    }
    const validRoles: OrgRole[] = ['admin', 'member', 'viewer'];
    const r = role && validRoles.includes(role) ? role : 'member';
    try {
      const member = await this.prisma.organizationMember.create({
        data: { orgId, userId: resolvedUserId, role: r },
        select: { userId: true, role: true },
      });
      return { member: { user_id: member.userId, role: member.role } };
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === 'P2002') throw new BadRequestException('User is already a member');
      throw new BadRequestException(err instanceof Error ? err.message : 'Failed to add member');
    }
  }

  @Patch(':orgId/members/:userId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles('admin')
  async updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body('role') role: OrgRole,
  ) {
    const validRoles: OrgRole[] = ['admin', 'member', 'viewer'];
    if (!role || !validRoles.includes(role)) {
      throw new BadRequestException('Valid role (admin, member, viewer) is required');
    }
    await this.prisma.organizationMember.updateMany({
      where: { orgId, userId },
      data: { role },
    });
    return { ok: true };
  }

  @Delete(':orgId/members/:userId')
  async removeMember(
    @CurrentUser() user: JWTPayload,
    @Param('orgId') orgId: string,
    @Param('userId') targetUserId: string,
  ) {
    const currentUserId = user?.sub;
    if (!currentUserId) throw new ForbiddenException('Authentication required');
    const isSelf = targetUserId === currentUserId;
    if (!isSelf) {
      const member = await this.prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId, userId: currentUserId } },
      });
      if (!member || member.role !== 'admin') {
        throw new ForbiddenException('Only admins can remove other members');
      }
    }
    await this.prisma.organizationMember.deleteMany({
      where: { orgId, userId: targetUserId },
    });
    return { ok: true };
  }

  @Delete(':orgId')
  async deleteOrg(@CurrentUser() user: JWTPayload, @Param('orgId') orgId: string) {
    const userId = user?.sub;
    if (!userId) throw new ForbiddenException('Authentication required');
    const isSuperAdmin = user.platformRole === 'super_admin';
    if (!isSuperAdmin) {
      const member = await this.prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId, userId } },
      });
      if (!member || member.role !== 'admin') {
        throw new ForbiddenException('Only org admins or Super Admin can delete an organization');
      }
    }
    await this.prisma.organization.delete({ where: { id: orgId } });
    return { ok: true };
  }
}
