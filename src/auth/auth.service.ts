import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { verifyPassword } from '@/common/utils';
import { AllConfigType } from '@/config';
import { RawUser } from '@/features/users/types/users.types';
import { UsersService } from '@/features/users/users.service';
import { AuthLoginDto, AuthRegisterDto } from './dto';
import { JwtClaims, JwtPayloadType } from './types';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService<AllConfigType>,
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
          expiresIn: this.config.getOrThrow('auth.refreshTokenMaxAge', {
            infer: true,
          }),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
