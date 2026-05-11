import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import type { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin:
      process.env.WEB_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000',
    credentials: true,
  });

  app.use(cookieParser());

  // Webhook MP: precisa do raw body para validar assinatura.
  app.use(
    '/webhooks/mercado-pago',
    bodyParser.json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  // Demais rotas: sem isso o Nest não recebe `req.body` em POST JSON (só o parser do webhook acima não cobre /auth etc.).
  app.use((req: Request, res: Response, next: NextFunction) => {
    const pathOnly = req.originalUrl?.split('?')[0] ?? req.path;
    if (pathOnly === '/webhooks/mercado-pago') {
      return next();
    }
    return bodyParser.json()(req, res, next);
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.API_PORT ?? 3333);
}
bootstrap();
