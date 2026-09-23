import { Global, Module } from '@nestjs/common';

import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { FilesModule } from './files/files.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';

@Global()
@Module({
  imports: [DatabaseModule, FilesModule, CacheModule, QueueModule, RedisModule],
  exports: [DatabaseModule, FilesModule, CacheModule, QueueModule, RedisModule],
})
export class ProvidersModule {}
