import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Express } from 'express';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/shared/infrastructure/http/all-exceptions.filter.js';

const app: Express = express();

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

export default app;
