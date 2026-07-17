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
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import {
  CreateBranchDto,
  CreateTaxDto,
  UpdateBranchDto,
  UpdateSettingsDto,
  UpdateTaxDto,
} from '../../application/dto/config.dto.js';
import {
  BranchUseCases,
  SettingsUseCases,
  TaxUseCases,
} from '../../application/use-cases/config.use-case.js';
import { Audit } from '../../domain/decorators/audit.decorator.js';
import { AuditInterceptor } from '../../domain/interceptors/audit.interceptor.js';

@ApiTags('configuration')
@ApiBearerAuth('access-token')
@Controller()
@TenantRequired()
@UseInterceptors(AuditInterceptor)
export class ConfigController {
  constructor(
    private readonly branchUseCases: BranchUseCases,
    private readonly taxUseCases: TaxUseCases,
    private readonly settingsUseCases: SettingsUseCases,
  ) {}

  // --- Branches ---
  @Get('branches')
  @ApiOperation({ summary: 'Listar sucursales' })
  async listBranches() {
    return this.branchUseCases.list();
  }

  @Post('branches')
  @HttpCode(HttpStatus.CREATED)
  @Audit('CREATE', 'Branch')
  @ApiOperation({ summary: 'Crear sucursal' })
  @ApiBody({ type: CreateBranchDto })
  async createBranch(@Body() dto: CreateBranchDto) {
    return this.branchUseCases.create(dto);
  }

  @Get('branches/:id')
  @ApiOperation({ summary: 'Obtener sucursal' })
  @ApiParam({ name: 'id' })
  async getBranch(@Param('id') id: string) {
    return this.branchUseCases.getById(id);
  }

  @Patch('branches/:id')
  @Audit('UPDATE', 'Branch')
  @ApiOperation({ summary: 'Actualizar sucursal' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateBranchDto })
  async updateBranch(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchUseCases.update(id, dto);
  }

  @Delete('branches/:id')
  @Audit('DELETE', 'Branch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar sucursal (soft delete)' })
  @ApiParam({ name: 'id' })
  async deleteBranch(@Param('id') id: string) {
    return this.branchUseCases.delete(id);
  }

  // --- Taxes ---
  @Get('taxes')
  @ApiOperation({ summary: 'Listar impuestos' })
  async listTaxes() {
    return this.taxUseCases.list();
  }

  @Post('taxes')
  @HttpCode(HttpStatus.CREATED)
  @Audit('CREATE', 'Tax')
  @ApiOperation({ summary: 'Crear impuesto' })
  @ApiBody({ type: CreateTaxDto })
  async createTax(@Body() dto: CreateTaxDto) {
    return this.taxUseCases.create(dto);
  }

  @Get('taxes/:id')
  @ApiOperation({ summary: 'Obtener impuesto' })
  @ApiParam({ name: 'id' })
  async getTax(@Param('id') id: string) {
    return this.taxUseCases.getById(id);
  }

  @Patch('taxes/:id')
  @Audit('UPDATE', 'Tax')
  @ApiOperation({ summary: 'Actualizar impuesto' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateTaxDto })
  async updateTax(@Param('id') id: string, @Body() dto: UpdateTaxDto) {
    return this.taxUseCases.update(id, dto);
  }

  @Delete('taxes/:id')
  @Audit('DELETE', 'Tax')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar impuesto' })
  @ApiParam({ name: 'id' })
  async deleteTax(@Param('id') id: string) {
    return this.taxUseCases.delete(id);
  }

  // --- Settings ---
  @Get('settings')
  @ApiOperation({ summary: 'Obtener todas las configuraciones' })
  async getSettings() {
    return this.settingsUseCases.getAll();
  }

  @Patch('settings')
  @Audit('UPDATE', 'Settings')
  @ApiOperation({ summary: 'Actualizar configuraciones (merge)' })
  @ApiBody({ type: UpdateSettingsDto })
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsUseCases.updateMany(dto.settings);
  }

  @Patch('settings/ticket-header')
  @Audit('UPDATE', 'Settings')
  @ApiOperation({ summary: 'Actualizar ticket header' })
  async updateTicketHeader(@Body() dto: Record<string, string>) {
    return this.settingsUseCases.updateTicketHeader(dto);
  }
}
