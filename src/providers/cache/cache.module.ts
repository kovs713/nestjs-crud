import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import { AllConfigType } from '@/config';
import { REDIS_CLIENT } from './cache.constants';
import { CacheService } from './cache.service';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>): Redis =>
        new Redis({
          host: config.getOrThrow('redis.host', { infer: true }),
          port: config.getOrThrow('redis.port', { infer: true }),
          password: config.get('redis.password', { infer: true }),
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
