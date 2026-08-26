import { registerAs } from '@nestjs/config';
import { IsInt, IsString, Min } from 'class-validator';

import { validateConfig } from '@/config';

export type AuthConfig = {
  jwtSecret: string;
  jwtExpiredTime: string;

  refreshTokenCookie: string;
  refreshTokenMaxAge: number;
};

class EnvironmentVariableValidator {
  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRED_TIME: string;

  @IsString()
  REFRESH_TOKEN_COOKIE: string;

  @IsInt()
  @Min(0)
  REFRESH_TOKEN_MAX_AGE: number;
}

export default registerAs<AuthConfig>('auth', () => {
  const validatedConfig = validateConfig(
    process.env,
    EnvironmentVariableValidator,
  );

  return {
    jwtSecret: validatedConfig.JWT_SECRET,
    jwtExpiredTime: validatedConfig.JWT_EXPIRED_TIME,
    refreshTokenCookie: validatedConfig.REFRESH_TOKEN_COOKIE,
    refreshTokenMaxAge: validatedConfig.REFRESH_TOKEN_MAX_AGE,
  };
});
