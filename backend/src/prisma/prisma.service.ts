import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = env.databaseUrl || process.env.DATABASE_URL || '';
    const adapter = new PrismaPg({ connectionString });
    super({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  async onModuleInit() {
    if (env.databaseUrl) await this.$connect();
  }

  async onModuleDestroy() {
    if (env.databaseUrl) await this.$disconnect();
  }
}
