import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { env } from '../../config/env';
import { JWTPayload } from '../types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    try {
      const decoded = this.jwtService.verify<{ sub: string; email?: string }>(token, {
        secret: env.sessionSecret,
      });
      (request as Request & { user: JWTPayload }).user = {
        sub: decoded.sub,
        email: decoded.email,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
