import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AllConfigType } from '@/config';
import { RedisConfig } from './redis.config';
import { REDIS_CONFIG } from './redis.constants';

@Module({
  providers: [
    {
      provide: REDIS_CONFIG,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>): RedisConfig => ({
        host: config.getOrThrow<string>('redis.host', { infer: true }),
        port: config.getOrThrow('redis.port', { infer: true }),
        password: config.getOrThrow<string>('redis.password', { infer: true }),
      }),
    },
  ],
})
export class RedisModule {}
