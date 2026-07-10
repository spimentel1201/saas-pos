import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../shared/infrastructure/http/current-user.decorator.js';
import { Public } from '../../../../shared/infrastructure/http/public.decorator.js';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import { AuthTokensDto, PublicUserDto } from '../../application/dtos/auth-output.dto.js';
import { LoginDto, RefreshDto, SignupDto } from '../../application/dtos/auth.dto.js';
import { LoginUseCase } from '../../application/use-cases/login.use-case.js';
import { RefreshUseCase } from '../../application/use-cases/refresh.use-case.js';
import { SignupUseCase } from '../../application/use-cases/signup.use-case.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@ApiTags('auth')
@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class AuthController {
  constructor(
    private readonly signupUseCase: SignupUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post('signup')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Alta de un nuevo comercio + primer usuario owner',
    description:
      'Crea un Tenant (con schema PostgreSQL propio), el User owner y una Subscription en TRIALING de 14 dias.',
  })
  @ApiResponse({ status: 201, description: 'Tokens JWT + perfil del owner', type: AuthTokensDto })
  @ApiResponse({ status: 409, description: 'Email o slug ya registrados' })
  @ApiBody({ type: SignupDto })
  async signup(@Body() dto: SignupDto): Promise<AuthTokensDto> {
    return this.signupUseCase.execute(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login por email + password' })
  @ApiResponse({ status: 200, description: 'Tokens JWT + lista de tenants', type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto): Promise<AuthTokensDto> {
    return this.loginUseCase.execute(dto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotar refresh por nuevo access token' })
  @ApiResponse({ status: 200, schema: { properties: { accessToken: { type: 'string' } } } })
  @ApiResponse({ status: 401, description: 'Refresh invalido' })
  @ApiBody({ type: RefreshDto })
  async refresh(@Body() dto: RefreshDto): Promise<{ accessToken: string }> {
    return this.refreshUseCase.execute(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Invalida el refresh (MVP: no-op, wary de revocation en v2)' })
  async logout(): Promise<void> {
    // MVP: el refresh es JWT self-contained sin tabla de sesiones.
    // Para revocar de verdad se persisten jti en `revoked_tokens` en v2.
    return undefined;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Perfil del usuario autenticado + lista de tenants a los que pertenece',
  })
  @ApiResponse({ status: 200, description: 'Perfil del usuario + membresias' })
  async me(@CurrentUser() user: { sub: string; email: string }): Promise<PublicUserDto> {
    const u = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        tenants: { select: { role: true, tenant: { select: { slug: true, name: true } } } },
      },
    });
    if (!u) {
      return {
        id: user.sub,
        email: user.email,
        name: '',
        emailVerified: null,
        tenants: [],
      };
    }
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      emailVerified: u.emailVerified,
      tenants: u.tenants.map((m: (typeof u.tenants)[number]) => ({
        slug: m.tenant.slug,
        role: m.role,
        name: m.tenant.name,
      })),
    };
  }
}
