import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

export class TestDatabase {
  private container?: StartedPostgreSqlContainer;
  private pool?: Pool;

  db: NodePgDatabase;
  url: string;

  async start(): Promise<void> {
    this.container = await new PostgreSqlContainer(
      'postgres:18-alpine',
    ).start();

    this.url = this.container.getConnectionUri();
    this.pool = new Pool({ connectionString: this.url });
    this.db = drizzle({ client: this.pool });

    await migrate(this.db, { migrationsFolder: './drizzle' });
  }

  async reset(): Promise<void> {
    await this.db.execute(sql`TRUNCATE TABLE users CASCADE`);
  }

  async stop(): Promise<void> {
    await this.pool?.end();
    await this.container?.stop();
  }
}
