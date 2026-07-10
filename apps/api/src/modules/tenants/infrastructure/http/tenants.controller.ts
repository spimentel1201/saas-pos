import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import { JwtAuthGuard } from '../../../auth/infrastructure/http/jwt-auth.guard.js';
import {
  CreateBranchDto,
  CreateOnboardingProductDto,
  CreateTaxDto,
} from '../../application/dtos/onboarding.dto.js';
import {
  BranchDto,
  TaxDto,
  TenantDto,
  UsageDto,
} from '../../application/dtos/tenant-output.dto.js';
import { OnboardingService } from '../../application/services/onboarding.service.js';

@ApiTags('tenants')
@ApiBearerAuth('access-token')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@TenantRequired()
export class TenantsController {
  constructor(private readonly service: OnboardingService) {}

  @Get('me')
  @ApiOperation({ summary: 'Perfil del tenant activo (con estado de onboarding)' })
  @ApiResponse({ status: 200, description: 'Informacion del tenant' })
  async me(): Promise<TenantDto> {
    return this.service.getTenantProfile();
  }

  @Post('onboarding/branch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Onboarding // paso 1: crear primera sucursal' })
  @ApiResponse({ status: 201, description: 'Sucursal creada', type: BranchDto })
  @ApiResponse({ status: 409, description: 'Limite de sucursales del plan alcanzado' })
  @ApiBody({ type: CreateBranchDto })
  async createBranch(@Body() dto: CreateBranchDto): Promise<BranchDto> {
    return this.service.createBranch(dto);
  }

  @Post('onboarding/tax')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Onboarding // paso 2: crear primer impuesto (ej IVA)' })
  @ApiResponse({ status: 201, description: 'Impuesto creado', type: TaxDto })
  @ApiBody({ type: CreateTaxDto })
  async createTax(@Body() dto: CreateTaxDto): Promise<TaxDto> {
    return this.service.createTax(dto);
  }

  @Post('onboarding/product')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Onboarding // paso 3: crear primer producto' })
  @ApiResponse({
    status: 201,
    description: 'Producto creado',
    schema: { properties: { id: { type: 'string' } } },
  })
  @ApiBody({ type: CreateOnboardingProductDto })
  async createProduct(@Body() dto: CreateOnboardingProductDto): Promise<{ id: string }> {
    return this.service.createOnboardingProduct(dto);
  }

  @Get('branches')
  @ApiOperation({ summary: 'Lista de sucursales del tenant' })
  @ApiResponse({ status: 200, description: 'Listado de sucursales' })
  async branches(): Promise<BranchDto[]> {
    return this.service.listBranches();
  }

  @Get('usage')
  @ApiOperation({ summary: 'Contadores de uso del periodo actual (limpia del plan)' })
  @ApiResponse({ status: 200, description: 'Contadores de uso' })
  async usage(): Promise<UsageDto> {
    return this.service.getUsage();
  }
}
