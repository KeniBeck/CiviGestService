import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AgentesAuthService } from './agentes-auth.service';
import { LoginAgenteDto } from './dto/login-agente.dto';
import { ChangePasswordAgenteDto } from './dto/change-password-agente.dto';
import { JwtAgenteAuthGuard } from './guards/jwt-agente-auth.guard';
import { Request } from 'express';
import { Public } from './decorators/public.decorator';

@ApiTags('Agentes - Autenticación')
@Controller('agentes/auth')
export class AgentesAuthController {
  constructor(private readonly agentesAuthService: AgentesAuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login de agentes de campo' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        agente: { type: 'object' },
        requirePasswordChange: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginAgenteDto) {
    return this.agentesAuthService.login(loginDto);
  }

  @Public() // Bypass del guard global
  @UseGuards(JwtAgenteAuthGuard) // Solo agentes pueden acceder
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña del agente' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordAgenteDto,
    @Req() req: Request,
  ) {
    const agenteId = req.user?.['sub']; // ID del agente desde JWT
    return this.agentesAuthService.changePassword(agenteId, changePasswordDto);
  }

  @Public() // Bypass del guard global
  @UseGuards(JwtAgenteAuthGuard) // Solo agentes pueden acceder
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del agente autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del agente' })
  async getProfile(@Req() req: Request) {
    const agenteId = req.user?.['sub'];
    return this.agentesAuthService.getProfile(agenteId);
  }
}
