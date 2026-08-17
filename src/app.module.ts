import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import { FeaturesModule } from './features/features.module';
import databaseConfig from './providers/database/database.config';
import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env'],
    }),
    AuthModule,
    FeaturesModule,
    ProvidersModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
