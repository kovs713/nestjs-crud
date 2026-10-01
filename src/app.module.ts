import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import authConfig from './auth/auth.config';
import { AuthModule } from './auth/auth.module';
import { IdempotencyInterceptor } from './common/idempotency';
import appConfig from './config/app.config';
import { FeaturesModule } from './features/features.module';
import cacheConfig from './providers/cache/cache.config';
import databaseConfig from './providers/database/database.config';
import s3Config from './providers/files/s3/s3.config';
import { ProvidersModule } from './providers/providers.module';
import queueConfig from './providers/queue/queue.config';
import redisConfig from './providers/redis/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        authConfig,
        databaseConfig,
        s3Config,
        redisConfig,
        cacheConfig,
        queueConfig,
      ],
      envFilePath: ['.env'],
    }),
    AuthModule,
    ProvidersModule,
    FeaturesModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}
