import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.entity';

export const avatars = pgTable(
  'avatars',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    path: text('path').notNull(),
  },
  (table) => [index('avatars_users_id_idx').on(table.userId)],
);
