import { ConflictException } from '@nestjs/common';

import { TestDatabase } from '@/test/setup';
import { users } from '../entities/users.entity';
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
    const created = await repository.createUser(user);

    // then
    expect(created.id).toBeDefined();
    expect(created.login).toBe('john');
    expect(created.passwordHash).toBe('hash');
    expect(created.deletedAt).toBeNull();
  });

  it('should find a created user by login', async () => {
    // given
    const created = await repository.createUser(baseUser);

    // when
    const found = await repository.findUserByLogin(created.login);

    // then
    expect(found?.id).toBe(created.id);
  });

  it('should reject a duplicate login with a conflict', async () => {
    // given
    // :john already exists
    await repository.createUser(baseUser);

    // when
    const attempt = repository.createUser(baseUser);

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
    const created = await repository.createUser(baseUser);

    // when
    const deleted = await repository.softDeleteUserById(created.id);

    // then
    expect(deleted?.deletedAt).toBeInstanceOf(Date);
  });

  it('should hide soft-deleted users from reads but keep the row', async () => {
    // given
    // :soft-deleted user
    const created = await repository.createUser(baseUser);
    await repository.softDeleteUserById(created.id);

    // when
    const found = await repository.findById(created.id);
    const rawRows = await testDb.db.select().from(users);

    // then
    // :hidden behind the notDeleted filter...
    expect(found).toBeNull();
    // :...but still physically there
    expect(rawRows).toHaveLength(1);
  });

  it('should bump avatars_count on avatar create', async () => {
    // given
    const created = await repository.createUser(baseUser);

    // when
    await repository.createAvatar({
      userId: created.id,
      path: 'avatars/1.jpg',
    });
    await repository.createAvatar({
      userId: created.id,
      path: 'avatars/2.jpg',
    });

    // then
    const found = await repository.findById(created.id);
    expect(found?.avatarsCount).toBe(2);
  });

  it('should drop avatars_count on avatar delete', async () => {
    // given
    // :user with two avatars
    const created = await repository.createUser(baseUser);
    await repository.createAvatar({
      userId: created.id,
      path: 'avatars/1.jpg',
    });
    const doomed = await repository.createAvatar({
      userId: created.id,
      path: 'avatars/2.jpg',
    });

    // when
    const deleted = await repository.deleteAvatarByIdAndUserId(
      doomed.id,
      created.id,
    );

    // then
    expect(deleted?.id).toBe(doomed.id);
    const found = await repository.findById(created.id);
    expect(found?.avatarsCount).toBe(1);
  });

  it('should leave the count alone when deleting a missing avatar', async () => {
    // given
    const created = await repository.createUser(baseUser);
    await repository.createAvatar({
      userId: created.id,
      path: 'avatars/1.jpg',
    });

    // when
    const deleted = await repository.deleteAvatarByIdAndUserId(
      '00000000-0000-0000-0000-000000000000',
      created.id,
    );

    // then
    expect(deleted).toBeNull();
    const found = await repository.findById(created.id);
    expect(found?.avatarsCount).toBe(1);
  });

  it('should find only active users in the age range', async () => {
    // given
    const active = await repository.createUser({ ...baseUser, age: 25 });
    for (let i = 0; i < 3; i++)
      await repository.createAvatar({
        userId: active.id,
        path: `avatars/a${i}.jpg`,
      });

    const fewAvatars = await repository.createUser({
      ...baseUser,
      login: 'few',
      email: 'few@example.com',
      age: 25,
    });
    await repository.createAvatar({
      userId: fewAvatars.id,
      path: 'avatars/f.jpg',
    });

    const noDesc = await repository.createUser({
      ...baseUser,
      login: 'nodesc',
      email: 'nodesc@example.com',
      age: 25,
      description: null,
    });
    for (let i = 0; i < 3; i++)
      await repository.createAvatar({
        userId: noDesc.id,
        path: `avatars/n${i}.jpg`,
      });

    const old = await repository.createUser({
      ...baseUser,
      login: 'old',
      email: 'old@example.com',
      age: 60,
    });
    for (let i = 0; i < 3; i++)
      await repository.createAvatar({
        userId: old.id,
        path: `avatars/o${i}.jpg`,
      });

    const gone = await repository.createUser({
      ...baseUser,
      login: 'gone',
      email: 'gone@example.com',
      age: 25,
    });
    for (let i = 0; i < 3; i++)
      await repository.createAvatar({
        userId: gone.id,
        path: `avatars/g${i}.jpg`,
      });
    await repository.softDeleteUserById(gone.id);

    // when
    const found = await repository.findActiveUsers({
      minAge: 20,
      maxAge: 30,
      limit: 20,
      offset: 0,
    });

    // then
    expect(found.map((user) => user.id)).toEqual([active.id]);
  });
});
