import './config/load-env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { validateProductionConfig } from './config/production-config';

const expressParser = require('express') as {
  json(options: { limit: string }): unknown;
  urlencoded(options: { extended: boolean; limit: string }): unknown;
};

async function bootstrap() {
  validateProductionConfig();

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(expressParser.json({ limit: '6mb' }));
  app.use(expressParser.urlencoded({ extended: true, limit: '6mb' }));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  app.use(new SecurityMiddleware().use);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}

void bootstrap();
