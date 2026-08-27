import { AuthConfig } from '@/auth/auth.config';
import { CacheConfig } from '@/providers/cache/cache.config';
import { DatabaseConfig } from '@/providers/database/database.config';
import { AppConfig } from './app.config';

export type AllConfigType = {
  app: AppConfig;
  db: DatabaseConfig;
  auth: AuthConfig;
  redis: CacheConfig;
};
