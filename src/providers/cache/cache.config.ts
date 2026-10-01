import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional } from 'class-validator';

import { validateConfig } from '@/config';

export type CacheConfig = {
  defaultTtlSeconds: number;
  dbIndex: number;
};

class EnvironmentVariableValidator {
  @IsInt()
  @IsOptional()
  CACHE_DEFAULT_TTL_SECONDS?: number;

  @IsInt()
  @IsOptional()
  CACHE_DB_INDEX: number;
}

export default registerAs<CacheConfig>('cache', () => {
  const validatedConfig = validateConfig(
    process.env,
    EnvironmentVariableValidator,
  );

  return {
    dbIndex: validatedConfig.CACHE_DB_INDEX || 0,
    defaultTtlSeconds: validatedConfig.CACHE_DEFAULT_TTL_SECONDS || 3600,
  };
});
