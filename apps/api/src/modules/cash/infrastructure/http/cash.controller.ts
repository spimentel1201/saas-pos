import {
  Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import { CurrentUser } from '../../../../shared/infrastructure/http/current-user.decorator.js';
import { CashUseCases } from '../../application/use-cases/cash.use-case.js';
import {
  OpenCashSessionDto, CloseCashSessionDto, AddCashMovementDto, CashSessionQueryDto,
} from '../../application/dtos/cash.dto.js';

@ApiTags('cash')
@ApiBearerAuth('access-token')
@Controller('cash')
@TenantRequired()
export class CashController {
  constructor(private readonly cashUseCases: CashUseCases) {}

  @Post('open')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir sesión de caja' })
  @ApiBody({ type: OpenCashSessionDto })
  async open(
    @CurrentUser() user: { sub: string },
    @Body() dto: OpenCashSessionDto,
  ) {
    return this.cashUseCases.openSession(user.sub, dto);
  }

  @Get('open/:branchCode')
  @ApiOperation({ summary: 'Obtener sesión de caja abierta' })
  @ApiParam({ name: 'branchCode', description: 'Código de sucursal' })
  async getOpen(@Param('branchCode') branchCode: string) {
    return this.cashUseCases.getOpenSession(branchCode);
  }

  @Patch(':sessionId/close')
  @ApiOperation({ summary: 'Cerrar sesión de caja con arqueo' })
  @ApiParam({ name: 'sessionId', type: Number })
  @ApiBody({ type: CloseCashSessionDto })
  async close(
    @CurrentUser() user: { sub: string },
    @Param('sessionId') sessionId: string,
    @Body() dto: CloseCashSessionDto,
  ) {
    return this.cashUseCases.closeSession(Number(sessionId), user.sub, dto);
  }

  @Post(':sessionId/movements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar entrada/salida/reembolso de efectivo' })
  @ApiParam({ name: 'sessionId', type: Number })
  @ApiBody({ type: AddCashMovementDto })
  async addMovement(
    @CurrentUser() user: { sub: string },
    @Param('sessionId') sessionId: string,
    @Body() dto: AddCashMovementDto,
  ) {
    return this.cashUseCases.addMovement(Number(sessionId), user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar sesiones de caja' })
  @ApiQuery({ name: 'branchCode', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'CLOSED', 'RECONCILING'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async list(
    @Query() query: CashSessionQueryDto,
  ) {
    const sessions = await this.cashUseCases.listSessions(query.branchCode, query.status);
    return {
      data: sessions,
      total: sessions.length,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      totalPages: 1,
    };
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Obtener sesión de caja' })
  @ApiParam({ name: 'sessionId', type: Number })
  async get(@Param('sessionId') sessionId: string) {
    return this.cashUseCases.getSessionById(Number(sessionId));
  }

  @Get(':sessionId/movements')
  @ApiOperation({ summary: 'Listar movimientos de una sesión' })
  @ApiParam({ name: 'sessionId', type: Number })
  async listMovements(@Param('sessionId') sessionId: string) {
    return this.cashUseCases.getMovements(Number(sessionId));
  }
}