import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
