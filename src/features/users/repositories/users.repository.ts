import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gt, ilike, isNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { isUniqueViolation } from '@/providers/database/database-errors.util';
import { DATABASE_CLIENT } from '@/providers/database/database.constants';
import { SearchUsersDto } from '../dto';
import { avatars, users } from '../entities';
import {
  InsertAvatar,
  InsertUser,
  RawAvatar,
  RawUser,
  UpdateUser,
} from '../types';

const notDeleted = isNull(users.deletedAt);

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: NodePgDatabase) {}

  async searchUser({
    login,
    limit,
    offset,
  }: SearchUsersDto): Promise<RawUser[]> {
    const where = login
      ? and(notDeleted, ilike(users.login, `%${login}%`))
      : notDeleted;

    return this.db
      .select()
      .from(users)
      .where(where)
      .orderBy(users.createdAt)
      .limit(limit)
      .offset(offset);
  }

  async findById(id: string): Promise<RawUser | null> {
    const user = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), notDeleted));

    return user[0] ?? null;
  }

  async findUserByLogin(login: string): Promise<RawUser | null> {
    const user = await this.db
      .select()
      .from(users)
      .where(and(eq(users.login, login), notDeleted));

    return user[0] ?? null;
  }

  async findUserByEmail(email: string): Promise<RawUser | null> {
    const user = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), notDeleted));

    return user[0] ?? null;
  }

  async createUser(userData: InsertUser): Promise<RawUser> {
    try {
      const [user] = await this.db.insert(users).values(userData).returning();

      return user;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('user already exists');

      throw error;
    }
  }

  async updateUserById(
    id: string,
    userData: UpdateUser,
  ): Promise<RawUser | null> {
    try {
      const [user] = await this.db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(and(eq(users.id, id), notDeleted))
        .returning();

      return user ?? null;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('user already exists');

      throw error;
    }
  }

  async softDeleteUserById(id: string): Promise<RawUser | null> {
    const [user] = await this.db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(and(eq(users.id, id), notDeleted))
      .returning();

    return user ?? null;
  }

  async findAvatarById(id: string): Promise<RawAvatar | null> {
    const [avatar] = await this.db
      .select()
      .from(avatars)
      .where(eq(avatars.id, id));

    return avatar ?? null;
  }

  async findAvatarsByUserId(userId: string): Promise<RawAvatar[]> {
    return this.db
      .select()
      .from(avatars)
      .where(eq(avatars.userId, userId))
      .orderBy(desc(avatars.createdAt));
  }

  async createAvatar(data: InsertAvatar): Promise<RawAvatar> {
    return this.db.transaction(async (tx) => {
      const [avatar] = await tx.insert(avatars).values(data).returning();
      await tx
        .update(users)
        .set({ avatarsCount: sql`${users.avatarsCount} + 1` })
        .where(eq(users.id, data.userId));

      return avatar;
    });
  }

  async deleteAvatarByIdAndUserId(
    avatarId: string,
    userId: string | null,
  ): Promise<RawAvatar | null> {
    return this.db.transaction(async (tx) => {
      const whereCondition = userId
        ? and(eq(avatars.id, avatarId), eq(avatars.userId, userId))
        : eq(avatars.id, avatarId);

      const [avatar] = await tx
        .delete(avatars)
        .where(whereCondition)
        .returning();

      if (!avatar) return null;

      await tx
        .update(users)
        .set({ avatarsCount: sql`${users.avatarsCount} - 1` })
        .where(and(eq(users.id, avatar.userId), gt(users.avatarsCount, 0)));

      return avatar;
    });
  }
}
