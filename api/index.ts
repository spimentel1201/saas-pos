let cachedApp: any = null;

async function getApp() {
  if (cachedApp) return cachedApp;

  const { NestFactory } = await import('@nestjs/core');
  const { ExpressAdapter } = await import('@nestjs/platform-express');
  const express = (await import('express')).default;
  const { AppModule } = await import('../apps/api/src/app.module.js');
  const { AllExceptionsFilter } = await import('../apps/api/src/shared/infrastructure/http/all-exceptions.filter.js');
  const { ValidationPipe } = await import('@nestjs/common');

  const app = express();

  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(app), {
    bufferLogs: true,
  });

  nestApp.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug', 'Accept'],
  });

  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  nestApp.useGlobalFilters(nestApp.get(AllExceptionsFilter));
  nestApp.setGlobalPrefix('api/v1');

  await nestApp.init();

  cachedApp = app;
  return app;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
