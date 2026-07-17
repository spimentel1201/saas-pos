import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../shared/infrastructure/http/current-user.decorator.js';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import {
  CheckoutDto,
  ReturnDto,
  SaleQueryDto,
  VoidSaleDto,
} from '../../application/dtos/sales.dto.js';
import { SalesUseCases } from '../../application/use-cases/sales.use-case.js';

@ApiTags('sales')
@ApiBearerAuth('access-token')
@Controller('sales')
@TenantRequired()
export class SalesController {
  constructor(private readonly salesUseCases: SalesUseCases) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Procesar checkout multi-pago' })
  @ApiBody({ type: CheckoutDto })
  async checkout(@CurrentUser() user: { sub: string }, @Body() dto: CheckoutDto) {
    return this.salesUseCases.checkout(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta por ID' })
  @ApiParam({ name: 'id', description: 'ID de la venta (ULID)' })
  async getSale(@Param('id') id: string) {
    return this.salesUseCases.getById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ventas con filtros' })
  @ApiQuery({ name: 'branchCode', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['COMPLETED', 'VOID', 'RETURNED', 'PARTIAL_RETURN'],
  })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async search(@CurrentUser() _user: { sub: string }, @Query() query: SaleQueryDto) {
    const filters = {
      branchCode: query.branchCode,
      userId: undefined,
      from: query.dateFrom ? new Date(query.dateFrom) : undefined,
      to: query.dateTo ? new Date(query.dateTo) : undefined,
      status: query.status,
      customerId: query.customerId,
      page: query.page,
      limit: query.limit,
    };
    return this.salesUseCases.search(_user.sub, filters);
  }

  @Patch(':id/void')
  @ApiOperation({ summary: 'Anular venta' })
  @ApiParam({ name: 'id', description: 'ID de la venta (ULID)' })
  @ApiBody({ type: VoidSaleDto })
  async voidSale(@Param('id') id: string) {
    await this.salesUseCases.voidSale(id);
    return { id, status: 'VOID' };
  }

  @Post('returns')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar devolución (parcial o total)' })
  @ApiBody({ type: ReturnDto })
  async createReturn(@CurrentUser() user: { sub: string }, @Body() dto: ReturnDto) {
    return this.salesUseCases.createReturn(user.sub, dto);
  }

  @Get(':id/returns')
  @ApiOperation({ summary: 'Listar devoluciones de una venta' })
  @ApiParam({ name: 'id', description: 'ID de la venta (ULID)' })
  async listReturns(@Param('id') id: string) {
    return this.salesUseCases.listReturns(id);
  }
}
