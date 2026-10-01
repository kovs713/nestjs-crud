import { registerAs } from '@nestjs/config';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

import { validateConfig } from '@/config';

export type S3Config = {
  host: string;
  port: number;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  region: string;
  useSsl: boolean;

  presignedTtl?: number;
};

export class EnvironmentVariableValidator {
  @IsString()
  S3_HOST!: string;

  @IsInt()
  S3_PORT!: number;

  @IsString()
  S3_USERNAME!: string;

  @IsString()
  S3_PASSWORD!: string;

  @IsString()
  S3_BUCKET_NAME!: string;

  @IsString()
  S3_REGION!: string;

  @IsBoolean()
  S3_USE_SSL!: boolean;

  @IsOptional()
  @IsInt()
  S3_PRESIGNED_TTL?: number;
}

export default registerAs<S3Config>('s3', () => {
  const validatedConfig = validateConfig(
    process.env,
    EnvironmentVariableValidator,
  );

  return {
    host: validatedConfig.S3_HOST,
    port: validatedConfig.S3_PORT,
    accessKey: validatedConfig.S3_USERNAME,
    secretKey: validatedConfig.S3_PASSWORD,
    bucketName: validatedConfig.S3_BUCKET_NAME,
    region: validatedConfig.S3_REGION,
    useSsl: validatedConfig.S3_USE_SSL,
    presignedTtl: validatedConfig.S3_PRESIGNED_TTL || 3600,
  };
});
