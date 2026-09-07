import { Global, Module } from '@nestjs/common';

import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';

@Global()
@Module({
  imports: [DatabaseModule, CacheModule],
  exports: [DatabaseModule, CacheModule],
})
export class ProvidersModule {}
