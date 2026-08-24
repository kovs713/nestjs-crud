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
    it('should throws NOT_FOUND when the user is missing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should returns the user when found', async () => {
      const user = { ...mockUser, id: '1' };
      repository.findById.mockResolvedValue(user);

      await expect(service.getById('1')).resolves.toBe(user);
    });
  });

  describe('delete', () => {
    it('throws NOT_FOUND when nothing was deleted', async () => {
      repository.softDeleteById.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
