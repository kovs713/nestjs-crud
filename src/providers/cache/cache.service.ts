import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

import { REDIS_CLIENT } from './cache.constants';

@Injectable()
export class CacheService {
  private readonly logger: Logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);

      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (error: unknown) {
      this.logger.warn(`Failed to get: ${key}`);
      throw error;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);

    try {
      if (ttlSeconds) await this.redis.setex(key, ttlSeconds, raw);
      else await this.redis.set(key, raw);
    } catch (error: unknown) {
      this.logger.warn(`Failed to set: ${key}`);
      throw error;
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length) return;

    this.logger.log(`Deleting: ${keys.join(', ')}`);

    try {
      await this.redis.del(...keys);

      this.logger.log(`Successfully deleted: ${keys.join(', ')}`);
    } catch (error: unknown) {
      this.logger.warn(`Failed to delete: ${keys.join(', ')}`);
      throw error;
    }
  }
}
