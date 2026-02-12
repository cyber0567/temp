import 'dotenv/config';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env';
import { WsAdapter } from '@nestjs/platform-ws';

const JSON_BODY_LIMIT = '5mb';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || !env.frontendUrl) return cb(null, true);
      const allowed = env.frontendUrl.replace(/\/$/, '');
      const match = origin === allowed || origin === env.frontendUrl;
      cb(null, match ? origin : false);
    },
    credentials: true,
  });

  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(env.port);
}

bootstrap();
