import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * Entry point del API NestJS (Fastify).
 *
 * Sistema modular monolith multi-tenant para SaaS POS.
 * Disposicion completa del diseño en /PLAN-MVP-POS-SAAS.md seccion 4.
 */
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './shared/infrastructure/http/all-exceptions.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );

  const config = app.get(ConfigService);
  const port = Number(config.get<string>('API_PORT') ?? 3000);
  const isProd = config.get<string>('NODE_ENV') === 'production';

  // CORS para el frontend Next.js
  app.enableCors({
    origin: isProd ? [`https://*.${config.get<string>('TENANT_BASE_DOMAIN')}`] : true,
    credentials: true,
  });

  // Validacion global de DTOs (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Filtro global -> RFC7807 Problem Details
  app.useGlobalFilters(app.get(AllExceptionsFilter));

  // Prefijo global de version
  app.setGlobalPrefix('api/v1');

  // ---- Swagger / OpenAPI ----
  // Disponible en /api/v1/docs (solo en dev/staging)
  if (!isProd || config.get<string>('ENABLE_SWAGGER') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('POS SaaS API')
      .setDescription(
        'API del SaaS POS multi-tenant. RFC7807 Problem Details en errores. ' +
          'Endpoints tenant-scoped requieren header `X-Tenant-Slug` o subdomain.',
      )
      .setVersion('0.1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Tenant-Slug' }, 'tenant-slug')
      .addTag('auth', 'Autenticacion y onboarding')
      .addTag('tenants', 'Comercios y onboarding wizard')
      .addTag('billing', 'Suscripciones Stripe')
      .addTag('users', 'Usuarios y roles')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    Logger.log('Swagger en /api/v1/docs', 'Swagger');
  }

  await app.listen(port, '0.0.0.0');
  Logger.log(`API corriendo en http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Fallo el arranque de la API:', err);
  process.exit(1);
});
