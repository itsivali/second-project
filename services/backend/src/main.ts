import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(helmet());
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') || true, credentials: true });
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.getHttpAdapter().get('/health', (_req, res) => res.json({ status: 'ok', service: 'backend' }));

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');

  const shutdown = async (signal: string) => {
    console.log(JSON.stringify({ level: 'info', signal, message: 'shutting down', service: 'backend' }));
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  console.log(JSON.stringify({ level: 'info', port, message: 'listening', service: 'backend' }));
}
bootstrap();
