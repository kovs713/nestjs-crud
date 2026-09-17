import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { IFileService } from '@/providers/files/files.adapter';

import { UsersRepository } from './repositories';
import { RawUser } from './types/users.types';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: DeepMocked<UsersRepository>;
  let files: DeepMocked<IFileService>;

  const mockUser = {
    id: 'user_001',
    login: 'user_001',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: 'user',
    age: 10,
    description: 'user',
    avatarsCount: 0,
    createdAt: new Date(Date.now()),
    updatedAt: new Date(Date.now()),
    deletedAt: null,
  } satisfies RawUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: createMock<UsersRepository>(),
        },
        {
          provide: IFileService,
          useValue: createMock<IFileService>(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<DeepMocked<UsersRepository>>(UsersRepository);
    files = module.get<DeepMocked<IFileService>>(IFileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    it('should throw NOT_FOUND when the user is missing', async () => {
      // given
      // :no user with such id
      repository.findById.mockResolvedValue(null);

      // when
      const attempt = service.getById('missing');

      // then
      await expect(attempt).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should return the user when found', async () => {
      // given
      const user = { ...mockUser, id: '1' };
      repository.findById.mockResolvedValue(user);

      // when
      const found = await service.getById('1');

      // then
      expect(found).toBe(user);
    });
  });

  describe('avatars', () => {
    it('should return 404 when an avatar is missing or soft-deleted', async () => {
      repository.findAvatarById.mockResolvedValue(null);

      await expect(service.getAvatar('deleted')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(files.readFile.mock.calls).toHaveLength(0);
    });

    it.each([false, true])(
      'should soft-delete without deleting the file (admin: %s)',
      async (isAdmin) => {
        repository.softDeleteAvatarByIdAndUserId.mockResolvedValue({
          id: 'avatar_001',
          userId: mockUser.id,
          path: 'avatars/1.jpg',
          createdAt: new Date(),
          deletedAt: new Date(),
        });

        await service.deleteAvatar(mockUser.id, isAdmin, 'avatar_001');

        expect(repository.softDeleteAvatarByIdAndUserId.mock.calls).toEqual([
          ['avatar_001', isAdmin ? null : mockUser.id],
        ]);
        expect(files.deleteFile.mock.calls).toHaveLength(0);
      },
    );

    it('should return 404 when no avatar was soft-deleted', async () => {
      repository.softDeleteAvatarByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.deleteAvatar(mockUser.id, false, 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(files.deleteFile.mock.calls).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should throw NOT_FOUND when nothing was deleted', async () => {
      // given
      // :soft-delete matches no row
      repository.softDeleteUserById.mockResolvedValue(null);

      // when
      const attempt = service.delete('missing');

      // then
      await expect(attempt).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
