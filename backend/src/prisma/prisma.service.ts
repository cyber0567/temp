import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super(env.databaseUrl ? { datasources: { db: { url: env.databaseUrl } } } : undefined);
  }

  async onModuleInit() {
    if (env.databaseUrl) await this.$connect();
  }

  async onModuleDestroy() {
    if (env.databaseUrl) await this.$disconnect();
  }
}
