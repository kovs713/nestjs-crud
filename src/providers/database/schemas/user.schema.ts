import { string } from 'drizzle-orm/cockroach-core';
import { integer, pgTable, uuid } from 'drizzle-orm/pg-core';

export const userSchema = pgTable('users', {
  id: uuid('id').primaryKey(),
  login: string('login').unique().notNull(),
  email: string('email').unique(),
  password: string('password').notNull(),
  age: integer('age'),
  describtion: string('describtion'),
});
