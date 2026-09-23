import { users, usersRole } from '../entities';

export type RawUser = typeof users.$inferSelect;

export type InsertUser = typeof users.$inferInsert;

export type UpdateUser = Partial<Omit<InsertUser, 'createdAt'>>;

export type UserRole = (typeof usersRole.enumValues)[number];
