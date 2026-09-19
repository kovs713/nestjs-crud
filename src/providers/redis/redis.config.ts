import { registerAs } from '@nestjs/config';
import { IsInt, IsString } from 'class-validator';

import { validateConfig } from '@/config';

export type RedisConfig = {
  host: string;
  port: number;
  password: string;
};

class EnvironmentVariableValidator {
  @IsString()
  REDIS_HOST: string;

  @IsInt()
  REDIS_PORT: number;

  @IsString()
  REDIS_PASSWORD: string;
}

export default registerAs<RedisConfig>('redis', () => {
  const validatedConfig = validateConfig(
    process.env,
    EnvironmentVariableValidator,
  );

  return {
    host: validatedConfig.REDIS_HOST,
    port: validatedConfig.REDIS_PORT,
    password: validatedConfig.REDIS_PASSWORD,
  };
});
