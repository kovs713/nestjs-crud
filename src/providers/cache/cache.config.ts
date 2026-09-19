import { registerAs } from '@nestjs/config';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

import { validateConfig } from '@/config';

export type CacheConfig = {
  host: string;
  port: number;
  password: string;

  defaultCacheTtlSeconds: number;
};

class EnvironmentVariableValidator {
  @IsString()
  REDIS_HOST: string;

  @IsInt()
  REDIS_PORT: number;

  @IsOptional()
  REDIS_PASSWORD: string;

  @IsNumber()
  @IsOptional()
  DEFAULT_CACHE_TTL_SECONDS?: number;
}

export default registerAs<CacheConfig>('redis', () => {
  const validatedConfig = validateConfig(
    process.env,
    EnvironmentVariableValidator,
  );

  return {
    host: validatedConfig.REDIS_HOST,
    port: validatedConfig.REDIS_PORT,
    password: validatedConfig.REDIS_PASSWORD,

    defaultCacheTtlSeconds: validatedConfig.DEFAULT_CACHE_TTL_SECONDS || 60,
  };
});
