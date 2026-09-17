import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { and, DrizzleQueryError, eq, ilike, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DatabaseError } from 'pg';

import { DATABASE_CLIENT } from '@/providers/database/database.constants';
import { SearchUsersDto } from '../dto';
import { users } from '../entities';
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

const notDeleted = isNull(users.deletedAt);

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: NodePgDatabase) {}

  async search({ login, limit, offset }: SearchUsersDto): Promise<RawUser[]> {
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

  async findByLogin(login: string): Promise<RawUser | null> {
    const user = await this.db
      .select()
      .from(users)
      .where(and(eq(users.login, login), notDeleted));

    return user[0] ?? null;
  }

  async findByEmail(email: string): Promise<RawUser | null> {
    const user = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), notDeleted));

    return user[0] ?? null;
  }

  async create(userData: InsertUser): Promise<RawUser> {
    try {
      const [user] = await this.db.insert(users).values(userData).returning();

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

  async softDeleteById(id: string): Promise<RawUser | null> {
    const [user] = await this.db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(and(eq(users.id, id), notDeleted))
      .returning();

    return user ?? null;
  }
}
