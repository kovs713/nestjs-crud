import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { and, DrizzleQueryError, eq, ilike, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DatabaseError } from 'pg';

import { DATABASE_CLIENT } from '@/providers/database/database.constants';
import { SearchUsersDto } from '../dto';
import { usersEntity } from '../entities';
import { InsertUser, RawUser, UpdateUser } from '../types/users.types';

// postgresql error code
const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof DrizzleQueryError &&
    error.cause instanceof DatabaseError &&
    error.cause.code === UNIQUE_VIOLATION
  );
}

const notDeleted = isNull(usersEntity.deletedAt);

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: NodePgDatabase) {}

  async search({ login, limit, offset }: SearchUsersDto): Promise<RawUser[]> {
    const where = login
      ? and(notDeleted, ilike(usersEntity.login, `%${login}%`))
      : notDeleted;

    return this.db
      .select()
      .from(usersEntity)
      .where(where)
      .orderBy(usersEntity.createdAt)
      .limit(limit)
      .offset(offset);
  }

  async findById(id: string): Promise<RawUser | null> {
    const user = await this.db
      .select()
      .from(usersEntity)
      .where(and(eq(usersEntity.id, id), notDeleted));

    return user[0] ?? null;
  }

  async findByLogin(login: string): Promise<RawUser | null> {
    const user = await this.db
      .select()
      .from(usersEntity)
      .where(and(eq(usersEntity.login, login), notDeleted));

    return user[0] ?? null;
  }

  async findByEmail(email: string): Promise<RawUser | null> {
    const user = await this.db
      .select()
      .from(usersEntity)
      .where(and(eq(usersEntity.email, email), notDeleted));

    return user[0] ?? null;
  }

  async create(userData: InsertUser): Promise<RawUser> {
    try {
      const [user] = await this.db
        .insert(usersEntity)
        .values(userData)
        .returning();

      return user;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('user already exists');

      throw error;
    }
  }

  async updateById(id: string, userData: UpdateUser): Promise<RawUser | null> {
    try {
      const [user] = await this.db
        .update(usersEntity)
        .set({ ...userData, updatedAt: new Date() })
        .where(and(eq(usersEntity.id, id), notDeleted))
        .returning();

      return user ?? null;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('user already exists');

      throw error;
    }
  }

  async softDeleteById(id: string): Promise<RawUser | null> {
    const [user] = await this.db
      .update(usersEntity)
      .set({ deletedAt: new Date() })
      .where(and(eq(usersEntity.id, id), notDeleted))
      .returning();

    return user ?? null;
  }
}
