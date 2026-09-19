import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const usersRole = pgEnum('role', ['user', 'admin']);

export const users = pgTable(
  'users',
  {
    id: uuid('user_id').defaultRandom().primaryKey(),
    login: varchar('login').unique().notNull(),
    passwordHash: varchar('password_hash').notNull(),

    role: usersRole().notNull().default('user'),
    email: varchar('email').unique(),
    age: integer('age'),
    description: text('description'),
    avatarsCount: integer('avatars_count').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('users_active_filters_idx')
      .on(table.age, table.createdAt)
      .where(
        sql`${table.deletedAt} IS NULL
        AND ${table.avatarsCount} > 2
        AND ${table.description} IS NOT NULL
        AND ${table.description} <> '' `,
      ),

    // maybe it's non necessary, cause it depends on
    // whether the client request users w/o age filter or not
    // i'll just keep it here
    index('users_active_created_at_idx')
      .on(table.createdAt)
      .where(
        sql`${table.deletedAt} IS NULL
        AND ${table.avatarsCount} > 2
        AND ${table.description} IS NOT NULL
        AND ${table.description} <> '' `,
      ),
  ],
);
