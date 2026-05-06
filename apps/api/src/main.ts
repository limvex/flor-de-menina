import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  });

  const cookieParser = await import('cookie-parser');
  app.use(cookieParser.default());

  await app.listen(process.env.API_PORT ?? 3333);
}
bootstrap();
