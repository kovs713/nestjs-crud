import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

import { REDIS_CLIENT } from './cache.constants';

@Injectable()
export class CacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);

    return raw === null ? null : (JSON.parse(raw) as T);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);

    if (ttlSeconds) await this.redis.setex(key, ttlSeconds, raw);
    else await this.redis.set(key, raw);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length) await this.redis.del(...keys);
  }
}
