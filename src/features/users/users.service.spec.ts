import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CacheService } from '@/providers/cache/cache.service';
import { IFileService } from '@/providers/files/files.adapter';
import { generateFileMock } from '@/providers/files/s3/__mocks__/generate-file-mock';
import {
  CreateUserDto,
  SearchActiveUsersDto,
  SearchUsersDto,
  UpdateUserDto,
} from './dto';
import { UsersRepository } from './repositories';
import { RawUser } from './types/users.types';
import {
  CACHE_TTL_LIST,
  CACHE_TTL_USER,
  USER_ACTIVE_CACHE_KEY,
  USER_ACTIVE_CACHE_PREFIX,
  USER_CACHE_KEY,
  USER_SEARCH_CACHE_KEY,
  USER_SEARCH_CACHE_PREFIX,
} from './users.constants';
import { UsersService } from './users.service';
import { ActiveUserResponseDto } from './dto/active-user-response.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: DeepMocked<UsersRepository>;
  let files: DeepMocked<IFileService>;
  let cache: DeepMocked<CacheService>;

  const FIXED_DATE = new Date('2026-09-19T8:00:00Z');

  const mockUser = {
    id: 'user_001',
    login: 'user_001',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: 'user',
    age: 10,
    description: 'user',
    balance: '0.00',
    avatarsCount: 0,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
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
        {
          provide: CacheService,
          useValue: createMock<CacheService>(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<DeepMocked<UsersRepository>>(UsersRepository);
    files = module.get<DeepMocked<IFileService>>(IFileService);
    cache = module.get<DeepMocked<CacheService>>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('users', () => {
    describe('getById', () => {
      it('should throw NOT_FOUND when the user is missing', async () => {
        // given
        repository.findById.mockResolvedValue(null);
        cache.get.mockResolvedValue(null);

        // when & then
        await expect(service.getById('missing')).rejects.toBeInstanceOf(
          NotFoundException,
        );
        expect(repository.findById).toHaveBeenCalledWith('missing');
      });

      it('should return cached user on cache hit', async () => {
        // given
        const user = { ...mockUser, id: '1' };
        cache.get.mockResolvedValue(user);

        // when
        const found = await service.getById('1');

        // then
        expect(found).toBe(user);
        expect(repository.findById).not.toHaveBeenCalled();
      });

      it('should fetch and cache the user on cache miss', async () => {
        // given
        const user = { ...mockUser, id: '1' };
        cache.get.mockResolvedValue(null);
        repository.findById.mockResolvedValue(user);

        // when
        const found = await service.getById('1');

        // then
        expect(found).toBe(user);
        expect(cache.set).toHaveBeenCalledWith(
          USER_CACHE_KEY('1'),
          user,
          CACHE_TTL_USER,
        );
      });
    });

    describe('search', () => {
      it('should return cached result on cache hit', async () => {
        // given
        const dto: SearchUsersDto = { login: 'john', limit: 20, offset: 0 };
        const cached = [{ ...mockUser, id: '1' }];
        cache.get.mockResolvedValue(cached);

        // when
        const result = await service.search(dto);

        // then
        expect(result).toBe(cached);
        expect(repository.searchUser).not.toHaveBeenCalled();
      });

      it('should fetch and cache results on cache miss', async () => {
        // given
        const dto: SearchUsersDto = { login: 'john', limit: 20, offset: 0 };
        const users = [{ ...mockUser, id: '1' }];
        cache.get.mockResolvedValue(null);
        repository.searchUser.mockResolvedValue(users);

        // when
        const result = await service.search(dto);

        // then
        expect(result).toBe(users);
        expect(repository.searchUser).toHaveBeenCalledWith(dto);
        expect(cache.set).toHaveBeenCalledWith(
          USER_SEARCH_CACHE_KEY(dto),
          users,
          CACHE_TTL_LIST,
        );
      });
    });

    describe('searchActive', () => {
      const mockActiveUser = {
        id: 'user-1',
        login: 'testuser',
        email: 'test@example.com',
        role: 'user' as const,
        age: 25,
        description: 'Test description',
        avatarsCount: 3,
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
        lastAvatarId: 'avatar-uuid-123',
      } satisfies ActiveUserResponseDto;

      it('should return cached result on cache hit', async () => {
        // given
        const dto = {
          minAge: 18,
          limit: 20,
          offset: 0,
        } as SearchActiveUsersDto;

        const cached = [mockActiveUser];
        cache.get.mockResolvedValue(cached);

        // when
        const result = await service.searchActive(dto);

        // then
        expect(result).toBe(cached);
        expect(repository.findActiveUsers).not.toHaveBeenCalled();
        expect(cache.set).not.toHaveBeenCalled();
      });

      it('should fetch and cache results on cache miss', async () => {
        // given
        const dto = {
          minAge: 18,
          limit: 20,
          offset: 0,
        } as SearchActiveUsersDto;

        const fetchedUsers = [mockActiveUser];

        cache.get.mockResolvedValue(null);
        repository.findActiveUsers.mockResolvedValue(fetchedUsers);

        // when
        const result = await service.searchActive(dto);

        // then
        expect(result).toBe(fetchedUsers);
        expect(repository.findActiveUsers).toHaveBeenCalledWith(dto);
        expect(cache.set).toHaveBeenCalledWith(
          USER_ACTIVE_CACHE_KEY(dto),
          fetchedUsers,
          CACHE_TTL_LIST,
        );
      });
    });

    describe('create', () => {
      it('should create a user and invalidate list caches', async () => {
        // given
        const createUserDto: CreateUserDto = {
          login: 'new',
          password: 'pass',
          role: 'user',
          email: 'new@test.com',
        };
        const createdUser = { ...mockUser, id: 'new_id', ...createUserDto };
        repository.createUser.mockResolvedValue(createdUser);

        // when
        const result = await service.create(createUserDto);

        // then
        expect(result).toEqual(createdUser);
        expect(repository.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            login: 'new',
            email: 'new@test.com',
            role: 'user',
            passwordHash: expect.stringContaining('$argon2id'),
            age: undefined,
            description: undefined,
          }),
        );
        expect(cache.delByPrefix).toHaveBeenCalledWith(
          USER_SEARCH_CACHE_PREFIX,
        );
        expect(cache.delByPrefix).toHaveBeenCalledWith(
          USER_ACTIVE_CACHE_PREFIX,
        );
      });
    });

    describe('update', () => {
      it('should update user and invalidate related caches', async () => {
        // given
        const updateDto: UpdateUserDto = { description: 'updated bio' };
        const updatedUser = { ...mockUser, ...updateDto };
        repository.updateUserById.mockResolvedValue(updatedUser);

        // when
        const result = await service.update(mockUser.id, updateDto);

        // then
        expect(result).toEqual(updatedUser);
        expect(repository.updateUserById).toHaveBeenCalledWith(
          mockUser.id,
          updateDto,
        );
        expect(cache.delByPrefix).toHaveBeenCalledWith(
          USER_SEARCH_CACHE_PREFIX,
        );
        expect(cache.delByPrefix).toHaveBeenCalledWith(
          USER_ACTIVE_CACHE_PREFIX,
        );
        expect(cache.del).toHaveBeenCalledWith(USER_CACHE_KEY(mockUser.id));
      });
    });

    describe('delete', () => {
      it('should throw NOT_FOUND when nothing was deleted', async () => {
        // given
        repository.softDeleteUserById.mockResolvedValue(null);

        // when & then
        await expect(service.delete('missing')).rejects.toBeInstanceOf(
          NotFoundException,
        );
        expect(repository.softDeleteUserById).toHaveBeenCalledWith('missing');
      });

      it('should soft-delete user and invalidate list caches', async () => {
        // given
        repository.softDeleteUserById.mockResolvedValue(mockUser);

        // when
        const result = await service.delete('user_001');

        // then
        expect(result).toEqual(mockUser);
        expect(repository.softDeleteUserById).toHaveBeenCalledWith('user_001');
        expect(cache.delByPrefix).toHaveBeenCalledWith(
          USER_SEARCH_CACHE_PREFIX,
        );
        expect(cache.delByPrefix).toHaveBeenCalledWith(
          USER_ACTIVE_CACHE_PREFIX,
        );
        expect(cache.del).toHaveBeenCalledWith(USER_CACHE_KEY('user_001'));
      });
    });
  });

  describe('avatars', () => {
    describe('getAvatar', () => {
      it('should throw NOT_FOUND when an avatar is missing or soft-deleted', async () => {
        // given
        repository.findAvatarById.mockResolvedValue(null);

        // when & then
        await expect(service.getAvatar('deleted')).rejects.toBeInstanceOf(
          NotFoundException,
        );
        expect(files.readFile).not.toHaveBeenCalled();
      });

      it('should return presigned URL when avatar exists and is not deleted', async () => {
        // given
        const avatarId = 'avatar_001';
        const mockAvatar = {
          id: avatarId,
          userId: mockUser.id,
          path: 'avatars/1.jpg',
          createdAt: FIXED_DATE,
          deletedAt: null,
        };

        const mockPresignedUrl =
          'https://s3.amazonaws.com/bucket/avatars/1.jpg?X-Amz-Signature=abc123';

        repository.findAvatarById.mockResolvedValue(mockAvatar);
        files.readFile.mockResolvedValue(mockPresignedUrl);

        // when
        const result = await service.getAvatar(avatarId);

        // then
        expect(result).toEqual({
          id: avatarId,
          presignedUrl: mockPresignedUrl,
        });
        expect(repository.findAvatarById).toHaveBeenCalledWith(avatarId);
        expect(files.readFile).toHaveBeenCalledWith('avatars/1.jpg');
      });
    });

    describe('uploadAvatar', () => {
      it('should save avatar metadata and invalidate user caches', async () => {
        // given
        const file = generateFileMock();
        const newAvatar = {
          id: 'new_av',
          userId: mockUser.id,
          path: 'avatars/new.jpg',
          createdAt: FIXED_DATE,
          deletedAt: null,
        };
        repository.createAvatar.mockResolvedValue(newAvatar);

        // when
        const result = await service.uploadAvatar(mockUser.id, file);

        // then
        expect(result).toBe('new_av');
        expect(repository.createAvatar).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUser.id,
            path: expect.stringContaining('avatars/'),
          }),
        );
        expect(cache.delByPrefix).toHaveBeenCalledWith(
          USER_SEARCH_CACHE_PREFIX,
        );
        expect(cache.delByPrefix).toHaveBeenCalledWith(
          USER_ACTIVE_CACHE_PREFIX,
        );
      });
    });

    describe('deleteAvatar', () => {
      it.each([false, true])(
        'should soft-delete without deleting the file (admin: %s)',
        async (isAdmin) => {
          // given
          const avatarId = 'avatar_001';
          repository.softDeleteAvatarByIdAndUserId.mockResolvedValue({
            id: avatarId,
            userId: mockUser.id,
            path: 'avatars/1.jpg',
            createdAt: FIXED_DATE,
            deletedAt: FIXED_DATE,
          });

          // when
          await service.deleteAvatar(mockUser.id, isAdmin, avatarId);

          // then
          expect(repository.softDeleteAvatarByIdAndUserId).toHaveBeenCalledWith(
            avatarId,
            isAdmin ? null : mockUser.id,
          );
          expect(files.deleteFile).not.toHaveBeenCalled();
        },
      );

      it('should invalidate list caches after avatar deletion', async () => {
        // given
        const avatarId = 'avatar_001';
        repository.softDeleteAvatarByIdAndUserId.mockResolvedValue({
          id: avatarId,
          userId: mockUser.id,
          path: 'avatars/1.jpg',
          createdAt: FIXED_DATE,
          deletedAt: null,
        });

        // when
        await service.deleteAvatar(mockUser.id, false, avatarId);

        // then
        expect(cache.delByPrefix).toHaveBeenCalledWith(
          USER_SEARCH_CACHE_PREFIX,
        );
        expect(cache.delByPrefix).toHaveBeenCalledWith(
          USER_ACTIVE_CACHE_PREFIX,
        );
      });

      it('should throw NOT_FOUND when no avatar was soft-deleted', async () => {
        // given
        repository.softDeleteAvatarByIdAndUserId.mockResolvedValue(null);

        // when & then
        await expect(
          service.deleteAvatar(mockUser.id, false, 'missing'),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(files.deleteFile).not.toHaveBeenCalled();
      });
    });

    describe('getUserAvatarUrls', () => {
      it('should return list of avatars with presigned URLs', async () => {
        // given
        const mockAvatars = [
          {
            id: 'av1',
            userId: mockUser.id,
            path: 'avatars/1.jpg',
            createdAt: FIXED_DATE,
            deletedAt: null,
          },
        ];
        repository.findAvatarsByUserId.mockResolvedValue(mockAvatars);
        files.readFile.mockResolvedValue('https://s3.../1.jpg');

        // when
        const result = await service.getUserAvatarUrls(mockUser.id);

        // then
        expect(repository.findAvatarsByUserId).toHaveBeenCalledWith(
          mockUser.id,
        );
        expect(files.readFile).toHaveBeenCalledWith('avatars/1.jpg');
        expect(result).toEqual([
          {
            id: 'av1',
            presignedUrl: 'https://s3.../1.jpg',
          },
        ]);
      });
    });
  });
});
