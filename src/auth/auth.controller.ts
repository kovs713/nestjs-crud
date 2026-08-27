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
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { Idempotent } from '@/common/idempotency';
import type { RequestWithUser } from '@/common/types';
import { toUserResponse, UserResponseDto } from '@/users/dto';
import { UsersService } from '@/users/users.service';
import { REFRESH_TOKEN_CONFIG } from './auth.constants';
import { AuthService } from './auth.service';
import { AuthLoginDto, AuthRegisterDto, AuthTokensDto } from './dto';
import type { JwtPayloadType, RefreshTokenConfig } from './types';

/**
 * Refresh token is delivered via an http-only cookie (`refresh_token`).
 * It never appears in request/response bodies.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject(REFRESH_TOKEN_CONFIG)
    private readonly refreshTokenConfig: RefreshTokenConfig,
  ) {}

  @Idempotent()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a user account (role is always `user`), sets the refresh token as an http-only cookie and returns an access token with the created user.',
  })
  @ApiCreatedResponse({ type: AuthTokensDto, description: 'Account created' })
  @ApiBadRequestResponse({
    description: 'Validation failed (e.g. password shorter than 8 chars)',
  })
  async register(
    @Body() dto: AuthRegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensDto> {
    const { accessToken, refreshToken, user } =
      await this.authService.register(dto);

    res.cookie(
      this.refreshTokenConfig.name,
      refreshToken,
      this.refreshTokenConfig.options,
    );

    return { accessToken, user: toUserResponse(user) };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Log in',
    description:
      'Authenticates with either `login` or `email` plus a password. Sets the refresh token as an http-only cookie and returns an access token with the user.',
  })
  @ApiOkResponse({ type: AuthTokensDto, description: 'Authenticated' })
  @ApiBadRequestResponse({ description: 'Neither login nor email provided' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body() dto: AuthLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensDto> {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);

    res.cookie(
      this.refreshTokenConfig.name,
      refreshToken,
      this.refreshTokenConfig.options,
    );

    return { accessToken, user: toUserResponse(user) };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiCookieAuth('refresh_token')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Reads the refresh token from the `refresh_token` cookie, verifies it and issues a new access token together with a rotated refresh cookie. No body required.',
  })
  @ApiOkResponse({
    type: Object,
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
    description: 'New access token issued',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired refresh token',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = await this.authService.refresh(
      req.cookies?.[this.refreshTokenConfig.name] as string | undefined,
    );

    res.cookie(
      this.refreshTokenConfig.name,
      refreshToken,
      this.refreshTokenConfig.options,
    );

    return { accessToken };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiCookieAuth('refresh_token')
  @ApiOperation({
    summary: 'Log out',
    description:
      'Clears the `refresh_token` cookie, ending the session. Returns an empty body.',
  })
  @ApiOkResponse({
    description: 'Refresh cookie cleared',
    schema: { type: 'object', nullable: true },
  })
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(
      this.refreshTokenConfig.name,
      this.refreshTokenConfig.options,
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns the profile of the user that owns the bearer access token.',
  })
  @ApiOkResponse({ type: UserResponseDto, description: 'Current user profile' })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async me(
    @Req() req: RequestWithUser<JwtPayloadType>,
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.usersService.getById(req.user.id));
  }
}
