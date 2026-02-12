import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PlatformRoleGuard } from '../common/guards/platform-role.guard';
import { PlatformRoles } from '../common/decorators/platform-roles.decorator';
import { PlatformRole } from '../common/types';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Controller('super-admin')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
@PlatformRoles('super_admin')
export class SuperAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('organizations')
  async listOrganizations() {
    const orgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
        companySize: true,
        createdAt: true,
        _count: { select: { profiles: true, members: true } },
      },
    });
    return {
      organizations: orgs.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        industry: o.industry ?? undefined,
        company_size: o.companySize ?? undefined,
        created_at: o.createdAt,
        user_count: o._count.profiles,
        member_count: o._count.members,
      })),
    };
  }

  @Get('users')
  async listUsers() {
    const profiles = await this.prisma.profile.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 500,
      select: {
        id: true,
        email: true,
        fullName: true,
        platformRole: true,
        organizationId: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
    });
    return {
      users: profiles.map((p) => ({
        id: p.id,
        email: p.email ?? undefined,
        full_name: p.fullName ?? undefined,
        platform_role: p.platformRole,
        organization_id: p.organizationId ?? undefined,
        organization: p.organization
          ? { id: p.organization.id, name: p.organization.name, slug: p.organization.slug }
          : undefined,
      })),
    };
  }

  @Post('create-user')
  async createUser(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('platformRole') platformRole: PlatformRole,
    @Body('organizationId') organizationId?: string | null,
  ) {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }
    const valid: PlatformRole[] = ['rep', 'admin', 'super_admin'];
    if (!platformRole || !valid.includes(platformRole)) {
      throw new BadRequestException('platformRole must be rep, admin, or super_admin');
    }
    if (platformRole !== 'super_admin' && !organizationId) {
      throw new BadRequestException('organizationId is required for rep and admin');
    }
    if (platformRole === 'super_admin' && organizationId) {
      throw new BadRequestException('Super Admin must not have an organization');
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email: normalizedEmail, passwordHash },
        select: { id: true, email: true },
      });
      await tx.profile.create({
        data: {
          id: u.id,
          email: u.email ?? normalizedEmail,
          platformRole,
          organizationId: platformRole === 'super_admin' ? null : organizationId!,
        },
      });
      if (platformRole !== 'super_admin' && organizationId) {
        await tx.organizationMember.create({
          data: {
            orgId: organizationId,
            userId: u.id,
            role: platformRole === 'admin' ? 'admin' : 'member',
          },
        });
      }
      return u;
    });
    return {
      id: user.id,
      email: user.email ?? normalizedEmail,
      platformRole,
      organizationId: platformRole === 'super_admin' ? null : organizationId ?? null,
    };
  }
}
