import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SuperAdminController],
})
export class SuperAdminModule {}
