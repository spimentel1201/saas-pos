import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../../shared/infrastructure/http/current-tenant.decorator.js';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import {
  CreateCategoryDto,
  CreateProductDto,
  UpdateCategoryDto,
  UpdateProductDto,
} from '../../application/dtos/catalog.dto.js';
import { CategoryUseCases } from '../../application/use-cases/category.use-case.js';
import { ProductUseCases } from '../../application/use-cases/product.use-case.js';

@ApiTags('catalog')
@ApiBearerAuth('access-token')
@Controller('catalog')
@TenantRequired()
export class CatalogController {
  constructor(
    private readonly productUseCases: ProductUseCases,
    private readonly categoryUseCases: CategoryUseCases,
  ) {}

  // PRODUCTOS
  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear producto' })
  @ApiBody({ type: CreateProductDto })
  async createProduct(@CurrentTenant() tenant: { id: string }, @Body() dto: CreateProductDto) {
    return this.productUseCases.create(tenant.id, 'system', dto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Listar productos con filtros y paginación' })
  @ApiQuery({ name: 'search', required: false, description: 'Búsqueda por nombre/SKU/barcode' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'] })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'hasStock', required: false, type: Boolean })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'sku', 'price', 'createdAt', 'updatedAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  // biome-ignore lint/suspicious/noExplicitAny: dynamic query params from Swagger
  async searchProducts(@CurrentTenant() tenant: { id: string }, @Query() query: any) {
    return this.productUseCases.search(tenant.id, query);
  }

  @Get('products/low-stock')
  @ApiOperation({ summary: 'Productos con stock bajo' })
  async getLowStock(@CurrentTenant() tenant: { id: string }) {
    return this.productUseCases.getLowStock(tenant.id);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto (ULID)' })
  async getProduct(@Param('id') id: string) {
    return this.productUseCases.getById(id);
  }

  @Get('products/sku/:sku')
  @ApiOperation({ summary: 'Obtener producto por SKU' })
  @ApiParam({ name: 'sku', description: 'SKU del producto' })
  async getProductBySku(@Param('sku') sku: string) {
    return this.productUseCases.getBySku(sku);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiParam({ name: 'id', description: 'ID del producto (ULID)' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productUseCases.update(id, dto);
  }

  @Patch('products/:id/status')
  @ApiOperation({ summary: 'Cambiar estado del producto' })
  @ApiParam({ name: 'id', description: 'ID del producto (ULID)' })
  @ApiBody({ schema: { example: { status: 'ACTIVE' } } })
  async changeProductStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED',
  ) {
    return this.productUseCases.changeStatus(id, status);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar producto' })
  @ApiParam({ name: 'id', description: 'ID del producto (ULID)' })
  async deleteProduct(@Param('id') id: string) {
    return this.productUseCases.delete(id);
  }

  // CATEGORÍAS
  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear categoría' })
  @ApiBody({ type: CreateCategoryDto })
  async createCategory(@CurrentTenant() tenant: { id: string }, @Body() dto: CreateCategoryDto) {
    return this.categoryUseCases.create(tenant.id, dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorías (árbol o planas)' })
  @ApiQuery({
    name: 'tree',
    required: false,
    type: Boolean,
    description: 'Devolver como árbol jerárquico',
  })
  async getCategories(@CurrentTenant() tenant: { id: string }, @Query('tree') tree?: string) {
    if (tree === 'true') {
      return this.categoryUseCases.getTree(tenant.id);
    }
    return this.categoryUseCases.getActive(tenant.id);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Obtener categoría por ID' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (ULID)' })
  async getCategory(@Param('id') id: string) {
    return this.categoryUseCases.findById(id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (ULID)' })
  @ApiBody({ type: UpdateCategoryDto })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryUseCases.update(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (ULID)' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoryUseCases.delete(id);
  }
}
