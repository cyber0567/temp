import { Controller, Get, Patch, Body, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JWTPayload } from '../common/types';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  async getAll(@CurrentUser() user: JWTPayload, @Query('orgId') orgId?: string) {
    return this.settings.getAll(user, orgId);
  }

  @Patch()
  async saveAll(@CurrentUser() user: JWTPayload, @Body() body: Parameters<SettingsService['saveAll']>[1]) {
    return this.settings.saveAll(user, body);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: JWTPayload) {
    return this.settings.getProfile(user.sub!);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: JWTPayload,
    @Body() body: { fullName?: string; timezone?: string; currency?: string; avatarUrl?: string | null },
  ) {
    return this.settings.updateProfile(user.sub!, body);
  }

  @Get('organization')
  async getOrganization(@CurrentUser() user: JWTPayload, @Query('orgId') orgId?: string) {
    return this.settings.getOrganization(user.sub!, orgId, user);
  }

  @Patch('organization')
  async updateOrganization(
    @CurrentUser() user: JWTPayload,
    @Body() body: {
      orgId: string;
      name?: string;
      industry?: string;
      companySize?: string;
      compliance?: { autoReview?: boolean; requireDisclosure?: boolean; autoFlagThreshold?: number };
      quality?: { minQaScore?: number; autoApproveThreshold?: number; enableEscalation?: boolean };
    },
  ) {
    const { orgId, compliance, quality, ...org } = body;
    if (!orgId) return this.settings.getOrganization(user.sub!, undefined, user);
    const effectiveOrgId = await this.settings.resolveOrgId(user, orgId);
    if (!effectiveOrgId) throw new ForbiddenException('Organization context required');
    return this.settings.updateOrganization(user.sub!, effectiveOrgId, {
      ...org,
      compliance,
      quality,
    });
  }

  @Get('notifications')
  async getNotifications(@CurrentUser() user: JWTPayload) {
    return this.settings.getNotifications(user.sub!);
  }

  @Patch('notifications')
  async updateNotifications(
    @CurrentUser() user: JWTPayload,
    @Body() body: { emailAlerts?: boolean; flaggedCalls?: boolean; dailyDigest?: boolean; weeklyReport?: boolean },
  ) {
    return this.settings.updateNotifications(user.sub!, body);
  }
}
