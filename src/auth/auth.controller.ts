import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { Idempotent } from '@/common/idempotency/idempotency.decorator';
import type { RequestWithUser } from '@/common/types';
import { toUserResponse, UserResponseDto } from '@/features/users/dto';
import { UsersService } from '@/features/users/users.service';
import { REFRESH_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { AuthLoginDto, AuthRegisterDto, AuthTokensDto } from './dto';
import type { JwtPayloadType, RefreshCookieConfig } from './types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject(REFRESH_COOKIE) private readonly refreshCookie: RefreshCookieConfig,
  ) {}

  @Idempotent()
  @Post('register')
  async register(
    @Body() dto: AuthRegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensDto> {
    const { accessToken, refreshToken, user } =
      await this.authService.register(dto);

    res.cookie(
      this.refreshCookie.name,
      refreshToken,
      this.refreshCookie.options,
    );

    return { accessToken, user: toUserResponse(user) };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: AuthLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensDto> {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);

    res.cookie(
      this.refreshCookie.name,
      refreshToken,
      this.refreshCookie.options,
    );

    return { accessToken, user: toUserResponse(user) };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = await this.authService.refresh(
      req.cookies?.[this.refreshCookie.name] as string | undefined,
    );

    res.cookie(
      this.refreshCookie.name,
      refreshToken,
      this.refreshCookie.options,
    );

    return { accessToken };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(this.refreshCookie.name, this.refreshCookie.options);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(
    @Req() req: RequestWithUser<JwtPayloadType>,
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.usersService.getById(req.user.id));
  }
}
