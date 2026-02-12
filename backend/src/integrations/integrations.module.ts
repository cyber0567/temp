import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
