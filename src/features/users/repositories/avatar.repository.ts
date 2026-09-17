import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DATABASE_CLIENT } from '@/providers/database/database.constants';
import { avatars } from '../entities';
import { InsertAvatar, RawAvatar } from '../types';

@Injectable()
export class AvatarRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: NodePgDatabase) {}

  async findById(id: string): Promise<RawAvatar | null> {
    const [avatar] = await this.db
      .select()
      .from(avatars)
      .where(eq(avatars.id, id));

    return avatar ?? null;
  }

  async findByUserId(userId: string): Promise<RawAvatar[]> {
    return this.db
      .select()
      .from(avatars)
      .where(eq(avatars.userId, userId))
      .orderBy(desc(avatars.createdAt));
  }

  async create(data: InsertAvatar): Promise<RawAvatar> {
    const [avatar] = await this.db.insert(avatars).values(data).returning();

    return avatar;
  }

  async deleteById(id: string): Promise<RawAvatar | null> {
    const [avatar] = await this.db
      .delete(avatars)
      .where(eq(avatars.id, id))
      .returning();

    return avatar ?? null;
  }
}
