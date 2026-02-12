import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MeController } from './me.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [MeController],
})
export class MeModule {}
