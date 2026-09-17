import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { verifyPassword } from '@/common/utils';
import { RawUser } from '@/features/users/types';
import { UsersService } from '@/features/users/users.service';
import { REFRESH_TOKEN_CONFIG } from './auth.constants';
import { AuthLoginDto, AuthRegisterDto } from './dto';
import type { JwtClaims, JwtPayloadType, RefreshTokenConfig } from './types';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @Inject(REFRESH_TOKEN_CONFIG)
    private readonly refreshTokenConfig: RefreshTokenConfig,
  ) {}

  async register(dto: AuthRegisterDto): Promise<Tokens & { user: RawUser }> {
    this.logger.log(`Registering user: ${dto.login}`);

    const user = await this.usersService.create({ ...dto, role: 'user' });

    this.logger.log(`Successfully registered: ${user.id}`);

    return { ...(await this.issueTokens(user)), user };
  }

  async login(dto: AuthLoginDto): Promise<Tokens & { user: RawUser }> {
    this.logger.log(`Login attempt: ${dto.login ?? dto.email}`);

    const user = await this.validate(dto);

    this.logger.log(`Successfully logged in: ${user.id}`);

    return { ...(await this.issueTokens(user)), user };
  }

  async refresh(token: string | undefined): Promise<Tokens> {
    if (!token) {
      this.logger.warn('Missing refresh token');
      throw new UnauthorizedException('Missing refresh token');
    }

    let payload: JwtPayloadType;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayloadType>(token);
    } catch {
      this.logger.warn('Invalid refresh token');
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      this.logger.warn('Invalid refresh token');
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.logger.log(`Refreshing tokens: ${payload.id}`);

    const user = await this.usersService.getById(payload.id);

    return this.issueTokens(user);
  }

  async validate(dto: AuthLoginDto): Promise<RawUser> {
    const user = await this.findUser(dto);

    if (!(await verifyPassword(dto.password, user.passwordHash))) {
      this.logger.warn(`Invalid credentials: ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async findUser(dto: AuthLoginDto): Promise<RawUser> {
    if (!dto.login && !dto.email) {
      throw new BadRequestException('login or email is required');
    }

    try {
      return dto.login
        ? await this.usersService.getByLogin(dto.login)
        : await this.usersService.getByEmail(dto.email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Invalid credentials: ${dto.login ?? dto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      throw error;
    }
  }

  private async issueTokens(user: RawUser): Promise<Tokens> {
    const claims: Omit<JwtClaims, 'type'> = { id: user.id, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ ...claims, type: 'access' }),
      this.jwtService.signAsync(
        { ...claims, type: 'refresh' },
        {
          expiresIn: this.refreshTokenConfig.options.maxAge,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
