import { AuthConfig } from '@/auth/auth.config';
import { CacheConfig } from '@/providers/cache/cache.config';
import { DatabaseConfig } from '@/providers/database/database.config';
import { S3Config } from '@/providers/files/s3/s3.config';
import { QueueConfig } from '@/providers/queue/queue.config';
import { RedisConfig } from '@/providers/redis/redis.config';
import { AppConfig } from './app.config';

export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  s3: S3Config;
  db: DatabaseConfig;
  redis: RedisConfig;
  cache: CacheConfig;
  queue: QueueConfig;
};
