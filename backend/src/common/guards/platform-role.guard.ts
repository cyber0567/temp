import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
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
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JWTPayload }>();
    let platformRole = request.user?.platformRole;

    if (!platformRole) {
      const userId = request.user?.sub;
      if (!userId) throw new UnauthorizedException('Authentication required');
      const profile = await this.prisma.profile.findUnique({
        where: { id: userId },
        select: { platformRole: true, organizationId: true },
      });
      platformRole = profile?.platformRole ?? 'rep';
      if (request.user) {
        request.user.platformRole = platformRole;
        if (profile?.organizationId !== undefined) request.user.orgId = profile.organizationId ?? undefined;
      }
    }

    const allowedRoles =
      this.reflector.getAllAndOverride<PlatformRole[]>(PLATFORM_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
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
