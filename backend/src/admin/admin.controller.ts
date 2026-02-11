import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PlatformRoleGuard } from '../common/guards/platform-role.guard';
import { PlatformRoles } from '../common/decorators/platform-roles.decorator';
import { PlatformRole } from '../common/types';

@Controller('admin')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
@PlatformRoles('super_admin')
export class AdminController {
  constructor(private readonly supabase: SupabaseService) {}

  @Patch('users/:userId/platform-role')
  async setPlatformRole(
    @Param('userId') userId: string,
    @Body('platformRole') platformRole: PlatformRole,
  ) {
    const valid: PlatformRole[] = ['rep', 'admin', 'super_admin'];
    if (!platformRole || !valid.includes(platformRole)) {
      throw new BadRequestException('platformRole must be rep, admin, or super_admin');
    }
    const { error } = await this.supabase
      .getClient()
      .from('profiles')
      .update({ platform_role: platformRole, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw new BadRequestException(error.message);
    return { ok: true, platformRole };
  }

  @Get('users')
  async listUsers() {
    const { data: profiles, error } = await this.supabase
      .getClient()
      .from('profiles')
      .select('id, email, full_name, platform_role, provider')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw new BadRequestException(error.message);
    return { users: profiles ?? [] };
  }
}
