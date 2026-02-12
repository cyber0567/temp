import { Module } from '@nestjs/common';
import { OrgsController } from './orgs.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [OrgsController],
})
export class OrgsModule {}
