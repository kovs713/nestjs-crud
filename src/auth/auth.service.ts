import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { verifyPassword } from '@/common/utils';
import { RawUser } from '@/features/users/types/users.types';
import { UsersService } from '@/features/users/users.service';
import { REFRESH_COOKIE } from './auth.constants';
import { AuthLoginDto, AuthRegisterDto } from './dto';
import type { JwtClaims, JwtPayloadType, RefreshCookieConfig } from './types';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @Inject(REFRESH_COOKIE) private readonly cookie: RefreshCookieConfig,
  ) {}

  async register(dto: AuthRegisterDto): Promise<Tokens & { user: RawUser }> {
    const user = await this.usersService.create({ ...dto, role: 'user' });

    return { ...(await this.issueTokens(user)), user };
  }

  async login(dto: AuthLoginDto): Promise<Tokens & { user: RawUser }> {
    const user = await this.validate(dto);

    return { ...(await this.issueTokens(user)), user };
  }

  async refresh(token: string | undefined): Promise<Tokens> {
    if (!token) throw new UnauthorizedException('Missing refresh token');

    let payload: JwtPayloadType;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayloadType>(token);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.getById(payload.id);

    return this.issueTokens(user);
  }

  async validate(dto: AuthLoginDto): Promise<RawUser> {
    const user = await this.findUser(dto);

    if (!(await verifyPassword(dto.password, user.passwordHash))) {
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
          expiresIn: this.cookie.options.maxAge,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
