import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AllConfigType } from '@/config';
import { RedisConfig } from '../redis/redis.config';
import { REDIS_CONFIG } from '../redis/redis.constants';
import { QueueConfig } from './queue.config';
import { QUEUE_CONFIG } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [REDIS_CONFIG, QUEUE_CONFIG],
      useFactory: (redisConfig: RedisConfig, queueConfig: QueueConfig) => ({
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
      }),
    }),
  ],
  providers: [
    {
      provide: QUEUE_CONFIG,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>): QueueConfig => ({
        dbIndex: config.getOrThrow('queue.dbIndex', { infer: true }),
        defaultAttempts: config.getOrThrow('queue.defaultAttempts', {
          infer: true,
        }),
        removeCompletedAgeDays: config.getOrThrow(
          'queue.removeCompletedAgeDays',
          {
            infer: true,
          },
        ),
        removeFailedAgeDays: config.getOrThrow('queue.removeFailedAgeDays', {
          infer: true,
        }),
      }),
    },
  ],
  exports: [BullModule],
})
export class QueueModule {}
