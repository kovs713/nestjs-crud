import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AllConfigType } from '@/config';
import { UsersModule } from '@/users/users.module';
import { REFRESH_TOKEN_CONFIG } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies';
import { RefreshTokenConfig } from './types';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) => ({
        secret: config.getOrThrow('auth.jwtSecret', { infer: true }),
        signOptions: {
          expiresIn: config.getOrThrow('auth.jwtExpiredTime', { infer: true }),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: REFRESH_TOKEN_CONFIG,
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<AllConfigType>,
      ): RefreshTokenConfig => ({
        name: config.getOrThrow<string>('auth.refreshTokenCookie', {
          infer: true,
        }),
        options: {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge:
            config.getOrThrow<number>('auth.refreshTokenMaxAge', {
              infer: true,
            }) * 1000,
        },
      }),
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
