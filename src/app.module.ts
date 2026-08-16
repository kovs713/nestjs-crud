import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigsModule } from './configs/configs.module';
import { FeaturesModule } from './features/features.module';
import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [
    ConfigsModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    FeaturesModule,
    ConfigsModule,
    ProvidersModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
