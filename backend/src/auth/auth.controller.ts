import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { RingCentralService } from '../config/ringcentral.service';
import { SupabaseService } from '../config/supabase.service';
import { env } from '../config/env';
import { PassportUser } from './strategies/google.strategy';
import { JWTPayload } from '../common/types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly ringCentral: RingCentralService,
    private readonly supabase: SupabaseService,
  ) {}

  @Post('signup')
  async signup(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('confirmPassword') confirmPassword: string,
    @Res() res: Response,
  ) {
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Email, password and confirm password are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and confirm password do not match' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const result = await this.authService.signup(email, password, confirmPassword);
    return res.status(result.status as number).json(
      'error' in result ? { error: result.error } : { message: result.message, user: result.user },
    );
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await this.authService.login(email, password);
    return res.status(result.status as number).json(
      'error' in result ? { error: result.error } : { token: result.token, user: result.user },
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string, @Res() res: Response) {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await this.authService.forgotPassword(email);
    return res.status(result.status as number).json(
      'error' in result ? { error: result.error } : { message: result.message },
    );
  }

  @Post('supabase-session')
  async supabaseSession(@Body('access_token') accessToken: string, @Res() res: Response) {
    if (!accessToken) {
      return res.status(400).json({ error: 'access_token is required' });
    }
    const result = await this.authService.exchangeSupabaseSession(accessToken);
    return res.status(result.status as number).json(
      'error' in result ? { error: result.error } : { token: result.token, user: result.user },
    );
  }

  @Post('supabase-update-password')
  async supabaseUpdatePassword(
    @Body('access_token') accessToken: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    if (!accessToken || !password) {
      return res.status(400).json({ error: 'access_token and password are required' });
    }
    const result = await this.authService.supabaseUpdatePassword(accessToken, password);
    return res.status(result.status as number).json(
      'error' in result ? { error: result.error } : { ok: true },
    );
  }

  @Post('verify-email')
  async verifyEmail(
    @Body('email') email: string,
    @Body('code') code: string,
    @Res() res: Response,
  ) {
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }
    const result = await this.authService.verifyEmail(email, code);
    return res.status(result.status as number).json(
      'error' in result ? { error: result.error } : { token: result.token, user: result.user },
    );
  }

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string, @Res() res: Response) {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await this.authService.resendVerification(email);
    return res.status(result.status as number).json(
      'error' in result ? { error: result.error } : { message: result.message },
    );
  }

  @Post('accept-invite')
  async acceptInvite(
    @Body('token') token: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }
    const result = await this.authService.acceptInvite(token, password);
    return res.status(result.status as number).json(
      'error' in result ? { error: result.error } : { token: result.token, user: result.user },
    );
  }

  @Get('google/redirect-uri')
  getGoogleRedirectUri() {
    const redirectUri =
      (env.googleCallbackUrl && env.googleCallbackUrl.trim()) ||
      `http://localhost:${env.port}/auth/google/callback`;
    return {
      redirect_uri: redirectUri,
      message:
        'Add this EXACT value in Google Cloud Console → APIs & Services → Credentials → your OAuth client → Authorized redirect URIs',
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    if (!env.googleClientId || !env.googleClientSecret) {
      throw new ServiceUnavailableException('Google OAuth is not configured');
    }
    // Passport redirects
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request & { user: PassportUser }, @Res() res: Response) {
    const user = req.user;
    const deactivated = await this.authService.getDeactivatedError(user.id);
    if (deactivated) {
      return res.redirect(
        `${env.frontendUrl}/login?error=${encodeURIComponent(deactivated.error)}`,
      );
    }
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: env.sessionSecret, expiresIn: '7d' },
    );
    const redirectUser = await this.authService.getOAuthRedirectUser(user.id, user.email);
    const userJson = encodeURIComponent(JSON.stringify(redirectUser));
    res.redirect(`${env.frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&user=${userJson}`);
  }

  @Post('ringcentral')
  @UseGuards(JwtAuthGuard)
  ringcentralInit(@CurrentUser() user: JWTPayload, @Res() res: Response) {
    if (!this.ringCentral.isConfigured()) {
      const missing = this.ringCentral.getMissingEnv();
      const message =
        missing.length > 0
          ? `RingCentral not configured. Missing in backend/.env: ${missing.join(', ')}. Restart the backend after adding them.`
          : 'RingCentral OAuth is not configured. Set RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_CALLBACK_URL in backend/.env and restart.';
      return res.status(503).json({ error: message, missing });
    }
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication required');
    }
    const { authUrl } = this.authService.getRingCentralAuthUrl(user.sub);
    return res.json({ authUrl });
  }

  @Get('ringcentral/callback')
  async ringcentralCallback(
    @Req() req: Request & { query: { code?: string; state?: string } },
    @Res() res: Response,
  ) {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(`${env.frontendUrl}/dashboard?error=ringcentral_missing_code`);
    }
    let userId: string;
    try {
      const decoded = this.jwtService.verify<{ userId?: string }>(state as string, {
        secret: env.sessionSecret,
      });
      if (!decoded?.userId) {
        return res.redirect(`${env.frontendUrl}/dashboard?error=ringcentral_invalid_state`);
      }
      userId = decoded.userId;
    } catch {
      return res.redirect(`${env.frontendUrl}/dashboard?error=ringcentral_invalid_state`);
    }
    try {
      const platform = this.ringCentral.getSDK().platform();
      await platform.login({
        code: code as string,
        redirect_uri: env.ringcentralCallbackUrl,
      });
      const token = await platform.auth().data();
      const accessToken = (token as { access_token?: string }).access_token;
      const refreshToken = (token as { refresh_token?: string }).refresh_token;
      const expiresIn = (token as { expires_in?: number }).expires_in ?? 3600;
      if (!accessToken || !refreshToken) {
        return res.redirect(`${env.frontendUrl}/dashboard?error=ringcentral_no_tokens`);
      }
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      await this.supabase.getClient().from('ringcentral_tokens').upsert(
        {
          user_id: userId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      return res.redirect(`${env.frontendUrl}/dashboard?ringcentral=connected`);
    } catch (e) {
      console.error('RingCentral OAuth error:', e);
      return res.redirect(`${env.frontendUrl}/dashboard?error=ringcentral_failed`);
    }
  }

  @Get('ringcentral/redirect-uri')
  ringcentralRedirectUri() {
    const redirectUri = env.ringcentralCallbackUrl || 'http://localhost:3001/auth/ringcentral/callback';
    return {
      redirect_uri: redirectUri,
      message:
        'Add this EXACT value in RingCentral Developer Portal → your app → Auth → Redirect URI. No trailing slash.',
    };
  }

  @Get('ringcentral/status')
  @UseGuards(JwtAuthGuard)
  async ringcentralStatus(@CurrentUser() user: JWTPayload) {
    if (!user?.sub) throw new UnauthorizedException('Authentication required');
    const { data } = await this.supabase
      .getClient()
      .from('ringcentral_tokens')
      .select('id')
      .eq('user_id', user.sub)
      .single();
    return { connected: !!data };
  }

  @Delete('ringcentral')
  @UseGuards(JwtAuthGuard)
  async ringcentralDisconnect(@CurrentUser() user: JWTPayload) {
    if (!user?.sub) throw new UnauthorizedException('Authentication required');
    await this.supabase.getClient().from('ringcentral_tokens').delete().eq('user_id', user.sub);
    return { ok: true, message: 'RingCentral disconnected' };
  }
}
