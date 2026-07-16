import { Module } from '@nestjs/common';
import { CatalogController } from './infrastructure/http/catalog.controller.js';
import { ProductUseCases } from './application/use-cases/product.use-case.js';
import { CategoryUseCases } from './application/use-cases/category.use-case.js';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository.js';
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository.js';
import { PRODUCT_REPO, CATEGORY_REPO, TENANT_SCHEMA } from './catalog.tokens.js';
import { TenantPrismaService } from '../../shared/infrastructure/prisma/tenant-prisma.service.js';
import { TenantContextModule } from '../../shared/infrastructure/multi-tenant/tenant-context.module.js';

@Module({
  imports: [TenantContextModule],
  controllers: [CatalogController],
  providers: [
    ProductUseCases,
    CategoryUseCases,
    TenantPrismaService,
    { provide: PRODUCT_REPO, useClass: PrismaProductRepository },
    { provide: CATEGORY_REPO, useClass: PrismaCategoryRepository },
    { provide: TENANT_SCHEMA, useFactory: () => '', inject: [] },
  ],
  exports: [ProductUseCases, CategoryUseCases],
})
export class CatalogModule {}
