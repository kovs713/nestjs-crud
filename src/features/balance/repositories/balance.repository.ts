import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DATABASE_CLIENT } from '@/providers/database/database.constants';

@Injectable()
export class BalanceRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: NodePgDatabase) {}
}
