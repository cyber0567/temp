import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import type { Profile, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PlatformRoleGuard } from '../common/guards/platform-role.guard';
import { PlatformRoles } from '../common/decorators/platform-roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { PlatformRole } from '../common/types';
import { JWTPayload } from '../common/types';

@Controller('admin')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  @Patch('users/:userId/platform-role')
  @PlatformRoles('super_admin')
  async setPlatformRole(
    @Param('userId') userId: string,
    @Body('platformRole') platformRole: PlatformRole,
  ) {
    const valid: PlatformRole[] = ['rep', 'admin', 'super_admin'];
    if (!platformRole || !valid.includes(platformRole)) {
      throw new BadRequestException('platformRole must be rep, admin, or super_admin');
    }
    await this.prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId, platformRole },
      update: { platformRole },
    });
    return { ok: true, platformRole };
  }

  @Get('users')
  @PlatformRoles('admin', 'super_admin')
  async listUsers(@CurrentUser() user: JWTPayload) {
    const isSuperAdmin = user.platformRole === 'super_admin';
    const orgId = user.orgId ?? undefined;
    if (!isSuperAdmin && !orgId) {
      throw new ForbiddenException('Organization context required');
    }
    const profiles = await this.prisma.profile.findMany({
      where: isSuperAdmin ? undefined : { organizationId: orgId },
      orderBy: { updatedAt: 'desc' },
      take: 500,
      select: { id: true, email: true, fullName: true, platformRole: true, provider: true, active: true },
    });
    return {
      users: profiles.map((p: Pick<Profile, 'id' | 'email' | 'fullName' | 'platformRole' | 'provider' | 'active'>) => ({
        id: p.id,
        email: p.email ?? undefined,
        full_name: p.fullName ?? undefined,
        platform_role: p.platformRole,
        provider: p.provider ?? undefined,
        active: p.active,
      })),
    };
  }

  @Delete('users/:userId')
  @PlatformRoles('super_admin')
  async removeUser(@Param('userId') userId: string, @CurrentUser() currentUser: JWTPayload) {
    if (userId === currentUser.sub) {
      throw new BadRequestException('You cannot remove your own account');
    }
    const prisma = this.prisma as unknown as PrismaClient;
    await this.prisma.$transaction([
      prisma.organizationMember.deleteMany({ where: { userId } }),
      prisma.ringcentralToken.deleteMany({ where: { userId } }),
      prisma.userNotificationSettings.deleteMany({ where: { userId } }),
      prisma.profile.deleteMany({ where: { id: userId } }),
      prisma.user.deleteMany({ where: { id: userId } }),
    ]);
    return { ok: true };
  }

  @Post('invite-user')
  @PlatformRoles('admin', 'super_admin')
  async inviteUser(
    @CurrentUser() user: JWTPayload,
    @Body('email') email: string,
    @Body('organizationId') bodyOrgId?: string,
  ) {
    const isSuperAdmin = user.platformRole === 'super_admin';
    const orgId = isSuperAdmin ? bodyOrgId : (user.orgId ?? undefined);
    if (!orgId) {
      throw new BadRequestException(
        isSuperAdmin ? 'organizationId is required for invite' : 'Organization context required',
      );
    }
    const result = await this.authService.inviteUser(user.sub, email, orgId);
    if ('error' in result) {
      throw new BadRequestException(result.error);
    }
    return { message: result.message, inviteLink: result.inviteLink };
  }
}
