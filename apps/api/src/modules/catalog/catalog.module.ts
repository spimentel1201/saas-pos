import { Module } from '@nestjs/common';
import { TenantContextModule } from '../../shared/infrastructure/multi-tenant/tenant-context.module.js';
import { TenantPrismaService } from '../../shared/infrastructure/prisma/tenant-prisma.service.js';
import { CategoryUseCases } from './application/use-cases/category.use-case.js';
import { ProductUseCases } from './application/use-cases/product.use-case.js';
import { CATEGORY_REPO, PRODUCT_REPO, TENANT_SCHEMA } from './catalog.tokens.js';
import { CatalogController } from './infrastructure/http/catalog.controller.js';
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository.js';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository.js';

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
