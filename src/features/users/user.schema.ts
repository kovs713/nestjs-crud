import { integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const userSchema = pgTable('users', {
  id: uuid('id').primaryKey(),
  login: varchar('login').unique().notNull(),
  email: varchar('email').unique(),
  password: varchar('password').notNull(),
  age: integer('age'),
  describtion: varchar('describtion'),
});
