import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

import type { CacheConfig } from './cache.config';
import { CACHE_OPTIONS, REDIS_CLIENT } from './cache.constants';

@Injectable()
export class CacheService {
  private readonly logger: Logger = new Logger(CacheService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(CACHE_OPTIONS) private readonly cacheConfig: CacheConfig,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);

      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to get: ${key}. ${error instanceof Error ? error.message : String(error)}`,
      );

      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.cacheConfig.defaultCacheTtlSeconds;

    if (ttlSeconds === undefined) {
      this.logger.warn(`No TTL for key "${key}", defaulting to ${ttl}s`);
    }

    const raw = JSON.stringify(value);

    try {
      await this.redis.setex(key, ttl, raw);
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to set: ${key}. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length) return;

    this.logger.log(`Deleting: ${keys.join(', ')}`);

    try {
      await this.redis.del(...keys);

      this.logger.log(`Successfully deleted: ${keys.join(', ')}`);
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to delete: ${keys.join(', ')}. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    let cursor = '0';
    const keys: string[] = [];

    try {
      do {
        const [nextCursor, found] = await this.redis.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          100,
        );

        keys.push(...found);

        cursor = nextCursor;
      } while (cursor !== '0');

      if (!keys.length) return;

      this.logger.log(`Deleting by prefix "${prefix}": ${keys.join(', ')}`);

      await this.redis.del(...keys);

      this.logger.log(
        `Successfully deleted by prefix "${prefix}": ${keys.join(', ')}`,
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to delete by prefix "${prefix}". ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
