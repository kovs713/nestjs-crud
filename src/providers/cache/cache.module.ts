import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import { AllConfigType } from '@/config';
import { RedisConfig } from '../redis/redis.config';
import { REDIS_CONFIG } from '../redis/redis.constants';
import { CacheConfig } from './cache.config';
import { CACHE_CLIENT, CACHE_CONFIG } from './cache.constants';
import { CacheService } from './cache.service';

@Module({
  providers: [
    {
      provide: CACHE_CONFIG,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>): CacheConfig => ({
        dbIndex: config.getOrThrow('cache.dbIndex', { infer: true }),
        defaultTtlSeconds: config.getOrThrow('cache.defaultTtlSeconds', {
          infer: true,
        }),
      }),
    },
    {
      provide: CACHE_CLIENT,
      inject: [REDIS_CONFIG, CACHE_CONFIG],
      useFactory: (redisConfig: RedisConfig, cacheConfig: CacheConfig): Redis =>
        new Redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          db: cacheConfig.dbIndex,
          lazyConnect: true,
          maxRetriesPerRequest: null,
        }),
    },
    CacheService,
  ],
  exports: [CacheService, CACHE_CLIENT],
})
export class CacheModule implements OnModuleDestroy {
  constructor(@Inject(CACHE_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
