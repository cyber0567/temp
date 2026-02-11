import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../config/supabase.service';
import { PLATFORM_ROLES_KEY } from '../decorators/platform-roles.decorator';
import { JWTPayload, PlatformRole } from '../types';

const ROLE_ORDER: PlatformRole[] = ['rep', 'admin', 'super_admin'];

function hasRole(userRole: PlatformRole | null | undefined, required: PlatformRole): boolean {
  if (!userRole) return false;
  return ROLE_ORDER.indexOf(userRole) >= ROLE_ORDER.indexOf(required);
}

@Injectable()
export class PlatformRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JWTPayload }>();
    let platformRole = request.user?.platformRole;

    if (!platformRole) {
      const userId = request.user?.sub;
      if (!userId) throw new UnauthorizedException('Authentication required');
      const { data: profile } = await this.supabase
        .getClient()
        .from('profiles')
        .select('platform_role')
        .eq('id', userId)
        .single();
      platformRole = (profile?.platform_role as PlatformRole) ?? 'rep';
      if (request.user) request.user.platformRole = platformRole;
    }

    const allowedRoles = this.reflector.get<PlatformRole[]>(PLATFORM_ROLES_KEY, context.getHandler()) ?? [];
    const ok = allowedRoles.length === 0 || allowedRoles.some((r) => hasRole(platformRole, r));
    if (!ok) {
      throw new ForbiddenException({
        error: `Requires platform role: ${allowedRoles.join(' or ')}`,
        yourRole: platformRole,
      });
    }
    return true;
  }
}
