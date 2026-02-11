import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgRoleGuard } from '../common/guards/org-role.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { OrgRoles } from '../common/decorators/org-roles.decorator';
import { JWTPayload } from '../common/types';
import { OrgRole } from '../common/types';

@Controller('orgs')
@UseGuards(JwtAuthGuard)
export class OrgsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async list(@CurrentUser() user: JWTPayload) {
    const userId = user?.sub;
    if (!userId) return { orgs: [] };
    const { data: members, error: membersError } = await this.supabase
      .getClient()
      .from('organization_members')
      .select('org_id, role')
      .eq('user_id', userId);
    if (membersError) throw new BadRequestException(membersError.message);
    const orgIds = (members ?? []).map((m) => m.org_id);
    if (orgIds.length === 0) return { orgs: [] };
    const { data: orgs, error: orgsError } = await this.supabase
      .getClient()
      .from('organizations')
      .select('id, name, slug')
      .in('id', orgIds);
    if (orgsError) throw new BadRequestException(orgsError.message);
    const roleByOrg = new Map((members ?? []).map((m) => [m.org_id, m.role as OrgRole]));
    return {
      orgs: (orgs ?? []).map((o) => ({ ...o, role: roleByOrg.get(o.id) })),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: JWTPayload, @Body('name') name: string) {
    const userId = user?.sub;
    if (!userId) throw new ForbiddenException('Authentication required');
    if (!name || typeof name !== 'string') {
      throw new BadRequestException('Organization name is required');
    }
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) throw new BadRequestException('Invalid organization name');
    const { data: org, error: orgError } = await this.supabase
      .getClient()
      .from('organizations')
      .insert({ name, slug })
      .select('id, name, slug')
      .single();
    if (orgError) {
      if (orgError.code === '23505') throw new BadRequestException('Organization slug already exists');
      throw new BadRequestException(orgError.message);
    }
    const { error: memberError } = await this.supabase
      .getClient()
      .from('organization_members')
      .insert({ org_id: org.id, user_id: userId, role: 'admin' });
    if (memberError) throw new BadRequestException(memberError.message);
    return { org: { ...org, role: 'admin' as OrgRole } };
  }

  @Get(':orgId/members')
  @UseGuards(OrgRoleGuard)
  @OrgRoles('admin')
  async listMembers(@Param('orgId') orgId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('organization_members')
      .select('user_id, role, created_at')
      .eq('org_id', orgId);
    if (error) throw new BadRequestException(error.message);
    return { members: data ?? [] };
  }

  @Post(':orgId/members')
  @UseGuards(OrgRoleGuard)
  @OrgRoles('admin')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('orgId') orgId: string,
    @Body('userId') userId: string,
    @Body('role') role: OrgRole | undefined,
  ) {
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestException('userId is required');
    }
    const validRoles: OrgRole[] = ['admin', 'member', 'viewer'];
    const r = role && validRoles.includes(role) ? role : 'member';
    const { data, error } = await this.supabase
      .getClient()
      .from('organization_members')
      .insert({ org_id: orgId, user_id: userId, role: r })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new BadRequestException('User is already a member');
      throw new BadRequestException(error.message);
    }
    return { member: data };
  }

  @Patch(':orgId/members/:userId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles('admin')
  async updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body('role') role: OrgRole,
  ) {
    const validRoles: OrgRole[] = ['admin', 'member', 'viewer'];
    if (!role || !validRoles.includes(role)) {
      throw new BadRequestException('Valid role (admin, member, viewer) is required');
    }
    const { error } = await this.supabase
      .getClient()
      .from('organization_members')
      .update({ role })
      .eq('org_id', orgId)
      .eq('user_id', userId);
    if (error) throw new BadRequestException(error.message);
    return { ok: true };
  }

  @Delete(':orgId/members/:userId')
  async removeMember(
    @CurrentUser() user: JWTPayload,
    @Param('orgId') orgId: string,
    @Param('userId') targetUserId: string,
  ) {
    const currentUserId = user?.sub;
    if (!currentUserId) throw new ForbiddenException('Authentication required');
    const isSelf = targetUserId === currentUserId;
    if (!isSelf) {
      const { data: member } = await this.supabase
        .getClient()
        .from('organization_members')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', currentUserId)
        .single();
      if (!member || (member.role as string) !== 'admin') {
        throw new ForbiddenException('Only admins can remove other members');
      }
    }
    const { error } = await this.supabase
      .getClient()
      .from('organization_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', targetUserId);
    if (error) throw new BadRequestException(error.message);
    return { ok: true };
  }
}
