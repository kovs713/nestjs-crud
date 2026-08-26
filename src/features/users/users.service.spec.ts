import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UsersRepository } from './repositories';
import { RawUser } from './types/users.types';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: DeepMocked<UsersRepository>;

  const mockUser = {
    id: 'user_001',
    login: 'user_001',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: 'user',
    age: 10,
    description: 'user',
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<DeepMocked<UsersRepository>>(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    it('should throw NOT_FOUND when the user is missing', async () => {
      // given
      //   no user with such id
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

  describe('delete', () => {
    it('should throw NOT_FOUND when nothing was deleted', async () => {
      // given
      //   soft-delete matches no row
      repository.softDeleteById.mockResolvedValue(null);

      // when
      const attempt = service.delete('missing');

      // then
      await expect(attempt).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
