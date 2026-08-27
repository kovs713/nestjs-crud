import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { AllConfigType } from '@/config';
import { DATABASE_CLIENT, DATABASE_POOL } from './database.constants';

@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>): Pool => {
        const pool = new Pool({
          connectionString: config.getOrThrow('db.url', { infer: true }),
        });

        return pool;
      },
    },
    {
      provide: DATABASE_CLIENT,
      inject: [DATABASE_POOL],
      useFactory: (pool: Pool): NodePgDatabase => {
        const client = drizzle({ client: pool });

        return client;
      },
    },
  ],
  exports: [DATABASE_POOL, DATABASE_CLIENT],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}
  async onModuleDestroy() {
    await this.pool.end();
  }
}
