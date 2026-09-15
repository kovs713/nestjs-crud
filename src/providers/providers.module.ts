import { Global, Module } from '@nestjs/common';

import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { FilesModule } from './files/files.module';

@Global()
@Module({
  imports: [DatabaseModule, CacheModule, FilesModule],
  exports: [DatabaseModule, CacheModule, FilesModule],
})
export class ProvidersModule {}
