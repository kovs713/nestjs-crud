import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Redis } from 'ioredis';

import { REDIS_CLIENT } from './cache.constants';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let redis: DeepMocked<Redis>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: REDIS_CLIENT, useValue: createMock<Redis>() },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redis = module.get<DeepMocked<Redis>>(REDIS_CLIENT);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('returns null on a miss', async () => {
      redis.get.mockResolvedValue(null);

      await expect(service.get('missing')).resolves.toBeNull();
    });

    it('parses the stored value', async () => {
      redis.get.mockResolvedValue('{"id":"1"}');

      await expect(service.get('user:1')).resolves.toEqual({ id: '1' });
    });
  });

  describe('set', () => {
    it('uses setex when a ttl is given', async () => {
      await service.set('user:1', { id: '1' }, 60);

      expect(redis.setex.mock.calls).toEqual([['user:1', 60, '{"id":"1"}']]);
      expect(redis.set.mock.calls).toHaveLength(0);
    });

    it('uses set when no ttl is given', async () => {
      await service.set('user:1', { id: '1' });

      expect(redis.set.mock.calls).toEqual([['user:1', '{"id":"1"}']]);
      expect(redis.setex.mock.calls).toHaveLength(0);
    });
  });
});
