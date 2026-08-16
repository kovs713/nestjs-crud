import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [],
      providers: [
        {
          provide: Symbol('DATABASE_CLIENT'),
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const pool = new Pool({
              database: config.getOrThrow<string>('DATABASE'),
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
