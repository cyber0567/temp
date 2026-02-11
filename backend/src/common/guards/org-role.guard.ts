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
import { SupabaseService } from '../../config/supabase.service';
import { ORG_ROLES_KEY } from '../decorators/org-roles.decorator';
import { OrgRole } from '../types';

@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const request = req as Request & { user?: { sub: string }; orgId?: string; orgRole?: OrgRole };
    const orgId = request.params?.orgId ?? request.body?.orgId ?? request.query?.orgId;
    if (!orgId || typeof orgId !== 'string') {
      throw new BadRequestException('Organization ID required');
    }
    const userId = request.user?.sub;
    if (!userId) throw new UnauthorizedException('Authentication required');

    const { data: member, error } = await this.supabase
      .getClient()
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (error || !member) {
      throw new ForbiddenException('Not a member of this organization');
    }
    const role = member.role as OrgRole;
    const allowedRoles = this.reflector.get<OrgRole[]>(ORG_ROLES_KEY, context.getHandler()) ?? [];
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      throw new ForbiddenException(`Requires one of: ${allowedRoles.join(', ')}`);
    }
    request.orgId = orgId;
    request.orgRole = role;
    return true;
  }
}
