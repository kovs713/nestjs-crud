import { avatars } from '../entities';

export type RawAvatar = typeof avatars.$inferSelect;

export type InsertAvatar = typeof avatars.$inferInsert;
