import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ORG_ROLES_KEY } from '../decorators/org-roles.decorator';
import { OrgRole } from '../types';

@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const request = req as Request & { user?: { sub: string; platformRole?: string; orgId?: string }; orgId?: string; orgRole?: OrgRole };
    const orgId = request.params?.orgId ?? request.body?.orgId ?? request.query?.orgId;
    if (!orgId || typeof orgId !== 'string') {
      throw new BadRequestException('Organization ID required');
    }
    const userId = request.user?.sub;
    if (!userId) throw new UnauthorizedException('Authentication required');

    const platformRole = request.user?.platformRole;
    if (platformRole === 'super_admin') {
      request.orgId = orgId;
      request.orgRole = 'admin';
      return true;
    }

    // Multi-tenant: USER/ADMIN can only access their primary org
    const userOrgId = request.user?.orgId;
    if (userOrgId && userOrgId !== orgId) {
      throw new ForbiddenException('You can only access your organization');
    }

    const member = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this organization');
    }
    const role = member.role;
    const allowedRoles = this.reflector.get<OrgRole[]>(ORG_ROLES_KEY, context.getHandler()) ?? [];
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      throw new ForbiddenException(`Requires one of: ${allowedRoles.join(', ')}`);
    }
    request.orgId = orgId;
    request.orgRole = role;
    return true;
  }
}
