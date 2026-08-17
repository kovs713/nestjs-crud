import { registerAs } from '@nestjs/config';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { validateConfig } from './validate-config';

enum Environment {
  DEV = 'DEVELOPMENT',
  PROD = 'PRODUCTION',
  TEST = 'TEST',
}

export type AppConfig = {
  nodeEnv: string;
  port: number;
  corsOrigins: string;
  apiPrefix: string;
};

class EnvironmentVariableValidator {
  @IsEnum(Environment)
  @IsString()
  NODE_ENV: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT: number;

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string;

  @IsString()
  @IsOptional()
  API_PREFIX: string;
}

export default registerAs<AppConfig>('app', () => {
  const validatedConfig = validateConfig(
    process.env,
    EnvironmentVariableValidator,
  );

  return {
    nodeEnv: validatedConfig.NODE_ENV || 'DEVELOPMENT',
    port: validatedConfig.PORT || 3000,
    corsOrigins: validatedConfig.CORS_ORIGINS || '*',
    apiPrefix: validatedConfig.API_PREFIX || 'api',
  };
});
