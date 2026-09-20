import { Global, Module } from '@nestjs/common';

import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { FilesModule } from './files/files.module';
import { QueueModule } from './queue/queue.module';

@Global()
@Module({
  imports: [DatabaseModule, FilesModule, CacheModule, QueueModule],
  exports: [DatabaseModule, FilesModule, CacheModule, QueueModule],
})
export class ProvidersModule {}
