import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { RingCentralService } from '../config/ringcentral.service';
import { SupabaseService } from '../config/supabase.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JWTPayload } from '../common/types';
import { env } from '../config/env';

/**
 * RingCentral integration endpoints.
 * Matches architecture: Frontend → Backend → RingCentral OAuth.
 */
@Controller('integrations/ringcentral')
export class IntegrationsController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly ringCentral: RingCentralService,
    private readonly supabase: SupabaseService,
  ) {}

  /**
   * GET /integrations/ringcentral/auth?state=JWT
   * Server-side redirect flow: Frontend redirects user here (with state from init URL),
   * backend verifies state and redirects to RingCentral OAuth.
   */
  @Get('auth')
  async authRedirect(
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!state) {
      return res.redirect(`${env.frontendUrl}/dashboard/rep-portal/dialer?error=ringcentral_missing_state`);
    }
    let userId: string;
    try {
      const decoded = this.jwtService.verify<{ userId?: string; purpose?: string }>(state, {
        secret: env.sessionSecret,
      });
      if (!decoded?.userId || decoded?.purpose !== 'rc_init') {
        return res.redirect(`${env.frontendUrl}/dashboard/rep-portal/dialer?error=ringcentral_invalid_state`);
      }
      userId = decoded.userId;
    } catch {
      return res.redirect(`${env.frontendUrl}/dashboard/rep-portal/dialer?error=ringcentral_invalid_state`);
    }
    if (!this.ringCentral.isConfigured()) {
      return res.redirect(`${env.frontendUrl}/dashboard/rep-portal/dialer?error=ringcentral_not_configured`);
    }
    const { authUrl } = this.authService.getRingCentralAuthUrl(userId);
    return res.redirect(authUrl);
  }

  /**
   * GET /integrations/ringcentral/init
   * Returns init URL for redirect flow. Requires JWT auth.
   * Frontend: fetch this (with Bearer token), then window.location.href = url
   */
  @Get('init')
  @UseGuards(JwtAuthGuard)
  async init(@CurrentUser() user: JWTPayload) {
    if (!user?.sub) throw new UnauthorizedException('Authentication required');
    if (!this.ringCentral.isConfigured()) {
      const missing = this.ringCentral.getMissingEnv();
      throw new ServiceUnavailableException(
        missing.length ? `RingCentral not configured. Missing: ${missing.join(', ')}` : 'RingCentral OAuth is not configured.',
      );
    }
    const { url } = this.authService.getRingCentralInitUrl(user.sub);
    return { url };
  }

  /**
   * GET /integrations/ringcentral/status
   * Returns { connected, expiresAt }. Matches architecture doc.
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async status(@CurrentUser() user: JWTPayload) {
    if (!user?.sub) throw new UnauthorizedException('Authentication required');
    const { data } = await this.supabase
      .getClient()
      .from('ringcentral_tokens')
      .select('id, expires_at')
      .eq('user_id', user.sub)
      .single();
    return { connected: !!data, expiresAt: data?.expires_at ?? null };
  }
}
