import { AuthConfig } from '@/auth/auth.config';
import { CacheConfig } from '@/providers/cache/cache.config';
import { DatabaseConfig } from '@/providers/database/database.config';
import { S3Config } from '@/providers/files/s3/s3.config';
import { AppConfig } from './app.config';

export type AllConfigType = {
  app: AppConfig;
  db: DatabaseConfig;
  auth: AuthConfig;
  redis: CacheConfig;
  s3: S3Config;
};
