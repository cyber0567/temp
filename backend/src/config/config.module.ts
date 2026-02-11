import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { RingCentralService } from './ringcentral.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [SupabaseService, RingCentralService],
  exports: [SupabaseService, RingCentralService],
})
export class ConfigModule {}
