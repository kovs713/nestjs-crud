import { ConflictException } from '@nestjs/common';

import { TestDatabase } from '@/test/setup';
import { usersEntity } from '../entities/users.entity';
import { InsertUser } from '../types/users.types';
import { UsersRepository } from './users.repository';

const testDb = new TestDatabase();
let repository: UsersRepository;

const baseUser: InsertUser = {
  login: 'john',
  passwordHash: 'hash',
  role: 'user',
  email: 'john@example.com',
  age: 30,
  description: 'just a guy',
};

beforeAll(async () => {
  await testDb.start();
  repository = new UsersRepository(testDb.db);
});

afterEach(() => testDb.reset());

afterAll(() => testDb.stop());

describe('UsersRepository (integration)', () => {
  it('should create a user', async () => {
    // given
    // :empty users table
    const user = { ...baseUser };

    // when
    const created = await repository.create(user);

    // then
    expect(created.id).toBeDefined();
    expect(created.login).toBe('john');
    expect(created.passwordHash).toBe('hash');
    expect(created.deletedAt).toBeNull();
  });

  it('should find a created user by login', async () => {
    // given
    const created = await repository.create(baseUser);

    // when
    const found = await repository.findByLogin(created.login);

    // then
    expect(found?.id).toBe(created.id);
  });

  it('should reject a duplicate login with a conflict', async () => {
    // given
    // :john already exists
    await repository.create(baseUser);

    // when
    const attempt = repository.create(baseUser);

    // then
    await expect(attempt).rejects.toBeInstanceOf(ConflictException);
  });

  it('should return null for a missing user', async () => {
    // given
    // :empty users table

    // when
    const found = await repository.findById(
      '00000000-0000-0000-0000-000000000000',
    );

    // then
    expect(found).toBeNull();
  });

  it('should set deleted_at on soft-delete', async () => {
    // given
    const created = await repository.create(baseUser);

    // when
    const deleted = await repository.softDeleteById(created.id);

    // then
    expect(deleted?.deletedAt).toBeInstanceOf(Date);
  });

  it('should hide soft-deleted users from reads but keep the row', async () => {
    // given
    // :soft-deleted user
    const created = await repository.create(baseUser);
    await repository.softDeleteById(created.id);

    // when
    const found = await repository.findById(created.id);
    const rawRows = await testDb.db.select().from(usersEntity);

    // then
    // :hidden behind the notDeleted filter...
    expect(found).toBeNull();
    // :...but still physically there
    expect(rawRows).toHaveLength(1);
  });
});
