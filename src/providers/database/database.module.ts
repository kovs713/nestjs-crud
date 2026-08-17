import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { AllConfigType } from '@/config';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [],
      providers: [
        {
          provide: Symbol('DATABASE_CLIENT'),
          inject: [ConfigService<AllConfigType>],
          useFactory: (config: ConfigService<AllConfigType>) => {
            const pool = new Pool({
              connectionString: config.getOrThrow('db.url', { infer: true }),
            });
            const client = drizzle({ client: pool });

            return client;
          },
        },
      ],
      exports: [],
    };
  }
}
