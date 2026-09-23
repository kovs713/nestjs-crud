import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AllConfigType } from '@/config';
import { RedisConfig } from '../redis/redis.config';
import { REDIS_CONFIG } from '../redis/redis.constants';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [RedisModule],
      inject: [ConfigService, REDIS_CONFIG],
      useFactory: (
        config: ConfigService<AllConfigType>,
        redisConfig: RedisConfig,
      ) => {
        const queueConfig = config.getOrThrow('queue', { infer: true });
        return {
          connection: {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            db: queueConfig.dbIndex,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          },
          defaultJobOptions: {
            attempts: queueConfig.defaultAttempts,

            removeOnComplete: {
              age: queueConfig.removeCompletedAgeDays * 24 * 3600,
              count: 1000,
            },
            removeOnFail: {
              age: queueConfig.removeFailedAgeDays * 24 * 3600,
            },
            backoff: { type: 'exponential', delay: 1000 },
          },
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
