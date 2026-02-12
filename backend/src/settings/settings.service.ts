import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JWTPayload } from '../common/types';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get user's primary org id (profile.organizationId) for multi-tenant isolation. */
  private async getPrimaryOrgId(userId: string): Promise<string | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    return profile?.organizationId ?? null;
  }

  /** Resolve org for request: SUPER_ADMIN can use any org; USER/ADMIN only their primary org. */
  async resolveOrgId(user: JWTPayload, requestedOrgId?: string): Promise<string | null> {
    const userId = user?.sub;
    if (!userId) return null;
    const isSuperAdmin = user.platformRole === 'super_admin';
    if (isSuperAdmin) {
      return requestedOrgId ?? (await this.getPrimaryOrgId(userId)) ?? (await this.getDefaultOrgId(userId));
    }
    const primary = user.orgId ?? (await this.getPrimaryOrgId(userId));
    if (requestedOrgId && requestedOrgId !== primary) {
      throw new ForbiddenException('You can only access your organization');
    }
    return primary ?? null;
  }

  /** Get user's first org id for org-scoped settings (fallback when no primary). */
  private async getDefaultOrgId(userId: string): Promise<string | null> {
    const first = await this.prisma.organizationMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return first?.orgId ?? null;
  }

  /** Ensure user is admin of the org. */
  private async ensureOrgAdmin(userId: string, orgId: string): Promise<void> {
    const member = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });
    if (!member || member.role !== 'admin') {
      throw new ForbiddenException('Only org admins can update organization settings');
    }
  }

  /** Check if user is org admin (or super_admin). Used to skip org update without throwing. */
  private async isOrgAdmin(user: JWTPayload, userId: string, orgId: string): Promise<boolean> {
    if (user.platformRole === 'super_admin') return true;
    const member = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
      select: { role: true },
    });
    return member?.role === 'admin';
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { fullName: true, timezone: true, currency: true, avatarUrl: true },
    });
    return {
      fullName: profile?.fullName ?? null,
      timezone: profile?.timezone ?? 'UTC',
      currency: profile?.currency ?? 'USD',
      avatarUrl: profile?.avatarUrl ?? null,
    };
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; timezone?: string; currency?: string; avatarUrl?: string | null },
  ) {
    const updates: { fullName?: string | null; timezone?: string; currency?: string; avatarUrl?: string | null } = {};
    if (data.fullName !== undefined) updates.fullName = data.fullName === '' ? null : data.fullName;
    if (data.timezone !== undefined) updates.timezone = data.timezone;
    if (data.currency !== undefined) updates.currency = data.currency;
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl === '' ? null : data.avatarUrl;

    await this.prisma.profile.upsert({
      where: { id: userId },
      create: {
        id: userId,
        fullName: updates.fullName ?? null,
        timezone: updates.timezone ?? 'UTC',
        currency: updates.currency ?? 'USD',
        avatarUrl: updates.avatarUrl ?? null,
        platformRole: 'rep',
      },
      update: Object.keys(updates).length ? updates : {},
    });
    return this.getProfile(userId);
  }

  async getOrganization(userId: string, orgId?: string, user?: JWTPayload) {
    const oid = user
      ? (await this.resolveOrgId(user, orgId)) ?? (await this.getDefaultOrgId(userId))
      : (orgId ?? (await this.getDefaultOrgId(userId)));
    if (!oid) return { organization: null, compliance: null, quality: null };

    const org = await this.prisma.organization.findUnique({
      where: { id: oid },
      select: { id: true, name: true, industry: true, companySize: true },
    });
    if (!org) return { organization: null, compliance: null, quality: null };

    const [compliance, quality] = await Promise.all([
      this.prisma.orgComplianceSettings.findUnique({ where: { orgId: oid } }),
      this.prisma.orgQualitySettings.findUnique({ where: { orgId: oid } }),
    ]);

    return {
      organization: {
        id: org.id,
        name: org.name,
        industry: org.industry ?? '',
        companySize: org.companySize ?? '',
      },
      compliance: compliance
        ? {
            autoReview: compliance.autoReview,
            requireDisclosure: compliance.requireDisclosure,
            autoFlagThreshold: compliance.autoFlagThreshold,
          }
        : {
            autoReview: true,
            requireDisclosure: true,
            autoFlagThreshold: 60,
          },
      quality: quality
        ? {
            minQaScore: quality.minQaScore,
            autoApproveThreshold: quality.autoApproveThreshold,
            enableEscalation: quality.enableEscalation,
          }
        : {
            minQaScore: 70,
            autoApproveThreshold: 85,
            enableEscalation: true,
          },
    };
  }

  async updateOrganization(
    userId: string,
    orgId: string,
    data: {
      name?: string;
      industry?: string;
      companySize?: string;
      compliance?: { autoReview?: boolean; requireDisclosure?: boolean; autoFlagThreshold?: number };
      quality?: { minQaScore?: number; autoApproveThreshold?: number; enableEscalation?: boolean };
    },
  ) {
    await this.ensureOrgAdmin(userId, orgId);

    const orgUpdates: { name?: string; slug?: string; industry?: string; companySize?: string } = {};
    if (data.name !== undefined) orgUpdates.name = data.name;
    if (data.industry !== undefined) orgUpdates.industry = data.industry;
    if (data.companySize !== undefined) orgUpdates.companySize = data.companySize;
    if (data.name !== undefined) {
      const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (slug) orgUpdates.slug = slug;
    }
    if (Object.keys(orgUpdates).length > 0) {
      await this.prisma.organization.update({
        where: { id: orgId },
        data: orgUpdates,
      });
    }

    if (data.compliance) {
      await this.prisma.orgComplianceSettings.upsert({
        where: { orgId },
        create: {
          orgId,
          autoReview: data.compliance.autoReview ?? true,
          requireDisclosure: data.compliance.requireDisclosure ?? true,
          autoFlagThreshold: data.compliance.autoFlagThreshold ?? 60,
        },
        update: {
          ...(data.compliance.autoReview !== undefined && { autoReview: data.compliance.autoReview }),
          ...(data.compliance.requireDisclosure !== undefined && { requireDisclosure: data.compliance.requireDisclosure }),
          ...(data.compliance.autoFlagThreshold !== undefined && { autoFlagThreshold: data.compliance.autoFlagThreshold }),
        },
      });
    }

    if (data.quality) {
      await this.prisma.orgQualitySettings.upsert({
        where: { orgId },
        create: {
          orgId,
          minQaScore: data.quality.minQaScore ?? 70,
          autoApproveThreshold: data.quality.autoApproveThreshold ?? 85,
          enableEscalation: data.quality.enableEscalation ?? true,
        },
        update: {
          ...(data.quality.minQaScore !== undefined && { minQaScore: data.quality.minQaScore }),
          ...(data.quality.autoApproveThreshold !== undefined && { autoApproveThreshold: data.quality.autoApproveThreshold }),
          ...(data.quality.enableEscalation !== undefined && { enableEscalation: data.quality.enableEscalation }),
        },
      });
    }

    return this.getOrganization(userId, orgId);
  }

  async getNotifications(userId: string) {
    const row = await this.prisma.userNotificationSettings.findUnique({
      where: { userId },
    });
    return {
      emailAlerts: row?.emailAlerts ?? true,
      flaggedCalls: row?.flaggedCalls ?? true,
      dailyDigest: row?.dailyDigest ?? false,
      weeklyReport: row?.weeklyReport ?? true,
    };
  }

  async updateNotifications(
    userId: string,
    data: { emailAlerts?: boolean; flaggedCalls?: boolean; dailyDigest?: boolean; weeklyReport?: boolean },
  ) {
    await this.prisma.userNotificationSettings.upsert({
      where: { userId },
      create: {
        userId,
        emailAlerts: data.emailAlerts ?? true,
        flaggedCalls: data.flaggedCalls ?? true,
        dailyDigest: data.dailyDigest ?? false,
        weeklyReport: data.weeklyReport ?? true,
      },
      update: {
        ...(data.emailAlerts !== undefined && { emailAlerts: data.emailAlerts }),
        ...(data.flaggedCalls !== undefined && { flaggedCalls: data.flaggedCalls }),
        ...(data.dailyDigest !== undefined && { dailyDigest: data.dailyDigest }),
        ...(data.weeklyReport !== undefined && { weeklyReport: data.weeklyReport }),
      },
    });
    return this.getNotifications(userId);
  }

  /** Get all settings in one response for the settings page. */
  async getAll(user: JWTPayload, orgId?: string) {
    const userId = user?.sub;
    if (!userId) throw new ForbiddenException('Authentication required');

    const oid = await this.resolveOrgId(user, orgId) ?? (await this.getDefaultOrgId(userId));
    const [profile, notifications, orgData] = await Promise.all([
      this.getProfile(userId),
      this.getNotifications(userId),
      oid ? this.getOrganization(userId, oid) : Promise.resolve({ organization: null, compliance: null, quality: null }),
    ]);

    return {
      profile,
      notifications,
      organization: orgData.organization,
      compliance: orgData.compliance,
      quality: orgData.quality,
      orgId: oid,
    };
  }

  /** Save all settings (profile, notifications, and optionally org if orgId provided and user is admin). */
  async saveAll(
    user: JWTPayload,
    payload: {
      profile?: { fullName?: string; timezone?: string; currency?: string; avatarUrl?: string | null };
      notifications?: { emailAlerts?: boolean; flaggedCalls?: boolean; dailyDigest?: boolean; weeklyReport?: boolean };
      organization?: { orgId: string; name?: string; industry?: string; companySize?: string };
      compliance?: { autoReview?: boolean; requireDisclosure?: boolean; autoFlagThreshold?: number };
      quality?: { minQaScore?: number; autoApproveThreshold?: number; enableEscalation?: boolean };
    },
  ) {
    const userId = user?.sub;
    if (!userId) throw new ForbiddenException('Authentication required');

    if (payload.profile) await this.updateProfile(userId, payload.profile);
    if (payload.notifications) await this.updateNotifications(userId, payload.notifications);

    const requestedOrgId = payload.organization?.orgId;
    const orgId = requestedOrgId ? await this.resolveOrgId(user, requestedOrgId) : null;
    if (orgId && (payload.organization || payload.compliance || payload.quality)) {
      const canUpdateOrg = await this.isOrgAdmin(user, userId, orgId);
      if (canUpdateOrg) {
        await this.updateOrganization(userId, orgId, {
          name: payload.organization?.name,
          industry: payload.organization?.industry,
          companySize: payload.organization?.companySize,
          compliance: payload.compliance,
          quality: payload.quality,
        });
      }
      // If not org admin, skip org update; profile and notifications are already saved
    }

    return this.getAll(user, orgId ?? undefined);
  }
}
