import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import authConfig from './auth/auth.config';
import { AuthModule } from './auth/auth.module';
import { IdempotencyInterceptor } from './common/idempotency';
import appConfig from './config/app.config';
import cacheConfig from './providers/cache/cache.config';
import databaseConfig from './providers/database/database.config';
import { ProvidersModule } from './providers/providers.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, cacheConfig],
      envFilePath: ['.env'],
    }),
    AuthModule,
    UsersModule,
    ProvidersModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}
