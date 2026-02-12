import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MeModule } from './me/me.module';
import { OrgsModule } from './orgs/orgs.module';
import { AdminModule } from './admin/admin.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { WsModule } from './ws/ws.module';
import { SettingsModule } from './settings/settings.module';
import { EmailModule } from './email/email.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    EmailModule,
    AuthModule,
    HealthModule,
    MeModule,
    OrgsModule,
    AdminModule,
    SuperAdminModule,
    WsModule,
    SettingsModule,
    IntegrationsModule,
  ],
})
export class AppModule {}
