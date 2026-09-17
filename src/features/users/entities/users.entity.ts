import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const usersRole = pgEnum('role', ['user', 'admin']);

export const users = pgTable('users', {
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
});
