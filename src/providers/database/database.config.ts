import { registerAs } from '@nestjs/config';
import { IsInt, IsString } from 'class-validator';

import { validateConfig } from '@/config';

export type DatabaseConfig = {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

class EnvironmentVariableValidator {
  @IsString()
  DB_URL: string;

  @IsString()
  DB_HOST: string;

  @IsInt()
  DB_PORT: number;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;
}

export default registerAs<DatabaseConfig>('db', () => {
  const validatedConfig = validateConfig(
    process.env,
    EnvironmentVariableValidator,
  );

  return {
    url: validatedConfig.DB_URL,
    host: validatedConfig.DB_HOST,
    port: validatedConfig.DB_PORT,
    username: validatedConfig.DB_USERNAME,
    password: validatedConfig.DB_PASSWORD,
    database: validatedConfig.DB_DATABASE,
  };
});
