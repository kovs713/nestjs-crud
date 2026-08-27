import { usersEntity, usersRole } from '../entities';

export type RawUser = typeof usersEntity.$inferSelect;

export type InsertUser = typeof usersEntity.$inferInsert;

export type UpdateUser = Partial<Omit<InsertUser, 'createdAt'>>;

export type UserRole = (typeof usersRole.enumValues)[number];
