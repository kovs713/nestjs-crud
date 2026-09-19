import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.entity';

export const avatars = pgTable(
  'avatars',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    path: text('path').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('avatars_users_id_idx').on(table.userId),

    index('avatars_users_latest_idx')
      .on(table.userId, table.createdAt)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);
