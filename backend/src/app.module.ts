import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MeModule } from './me/me.module';
import { OrgsModule } from './orgs/orgs.module';
import { AdminModule } from './admin/admin.module';
import { WsModule } from './ws/ws.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    HealthModule,
    MeModule,
    OrgsModule,
    AdminModule,
    WsModule,
  ],
})
export class AppModule {}
