import { config } from 'dotenv';
import { resolve, join } from 'path';

// Load .env file before anything else
config({ path: resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { existsSync, mkdirSync } from 'fs';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers (helmet)
  // Configure helmet to allow static assets and CORS
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow /uploads/ to be loaded from frontend
      contentSecurityPolicy: false, // Disable CSP for simplicity (can be configured per app needs)
    }),
  );

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Request ID middleware (must be early in the chain)
  const requestIdMiddleware = new RequestIdMiddleware();
  app.use((req, res, next) => requestIdMiddleware.use(req, res, next));

  // JSON body limit reduced since photos are now uploaded via /files/photos endpoint
  // File uploads via multer have their own 5MB per file limit
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ limit: '2mb', extended: true }));

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS for frontend
  // In production, ensure FRONTEND_URL is set to your actual frontend domain
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Enable validation with security settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are sent
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
