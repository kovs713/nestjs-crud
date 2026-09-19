import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import { AllConfigType } from '@/config';
import { CacheConfig } from './cache.config';
import { CACHE_OPTIONS, REDIS_CLIENT } from './cache.constants';
import { CacheService } from './cache.service';

@Module({
  providers: [
    {
      provide: CACHE_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>): CacheConfig => ({
        host: config.getOrThrow<string>('redis.host', { infer: true }),
        port: config.getOrThrow('redis.port', { infer: true }),
        password: config.getOrThrow<string>('redis.password', { infer: true }),
        defaultCacheTtlSeconds: config.getOrThrow(
          'redis.defaultCacheTtlSeconds',
          { infer: true },
        ),
      }),
    },
    {
      provide: REDIS_CLIENT,
      inject: [CACHE_OPTIONS],
      useFactory: (options: CacheConfig): Redis =>
        new Redis({
          host: options.host,
          port: options.port,
          password: options.password,
        }),
    },
    CacheService,
  ],
  exports: [CacheService, REDIS_CLIENT],
})
export class CacheModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
