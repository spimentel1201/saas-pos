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
  AdjustCreditDto,
  CreateCustomerDto,
  CustomerQueryDto,
  CustomerSearchQueryDto,
  UpdateCustomerDto,
} from '../../application/dtos/customer.dto.js';
import { CustomerUseCases } from '../../application/use-cases/customer.use-case.js';

@ApiTags('customers')
@ApiBearerAuth('access-token')
@Controller('customers')
@TenantRequired()
export class CustomerController {
  constructor(private readonly customerUseCases: CustomerUseCases) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiBody({ type: CreateCustomerDto })
  async create(@CurrentUser() user: { sub: string }, @Body() dto: CreateCustomerDto) {
    return this.customerUseCases.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar/buscar clientes' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['INDIVIDUAL', 'BUSINESS'] })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() query: CustomerQueryDto) {
    return this.customerUseCases.search(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Busqueda rapida para POS (telefono, nombre, email, DNI, RUC)' })
  @ApiQuery({ name: 'q', description: 'Texto de busqueda' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async searchPos(@Query() query: CustomerSearchQueryDto) {
    return this.customerUseCases.searchPos(query.q, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  async getById(@Param('id') id: string) {
    return this.customerUseCases.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiBody({ type: UpdateCustomerDto })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerUseCases.update(id, dto);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar cliente (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  async deactivate(@Param('id') id: string) {
    return this.customerUseCases.delete(id);
  }

  @Post(':id/credit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajustar credito del cliente (monedero)' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiBody({ type: AdjustCreditDto })
  async adjustCredit(@Param('id') id: string, @Body() dto: AdjustCreditDto) {
    return this.customerUseCases.adjustCredit(id, dto.amount);
  }

  @Get(':id/purchases')
  @ApiOperation({ summary: 'Historial de compras del cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPurchaseHistory(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customerUseCases.getPurchaseHistory(id, page, limit);
  }
}
