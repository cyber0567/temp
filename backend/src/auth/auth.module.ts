import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgRoleGuard } from '../common/guards/org-role.guard';
import { PlatformRoleGuard } from '../common/guards/platform-role.guard';
import { env } from '../config/env';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.sessionSecret,
      signOptions: { expiresIn: '7d' },
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtAuthGuard, OrgRoleGuard, PlatformRoleGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard, OrgRoleGuard, PlatformRoleGuard],
})
export class AuthModule {}
