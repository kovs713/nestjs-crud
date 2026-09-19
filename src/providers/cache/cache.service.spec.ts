import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Redis } from 'ioredis';

import type { CacheConfig } from './cache.config';
import { CACHE_OPTIONS, REDIS_CLIENT } from './cache.constants';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let redis: DeepMocked<Redis>;
  const mockCacheConfig: CacheConfig = {
    host: 'localhost',
    port: 6379,
    password: 'test-password',
    defaultCacheTtlSeconds: 60,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: REDIS_CLIENT,
          useValue: createMock<Redis>(),
        },
        {
          provide: CACHE_OPTIONS,
          useValue: mockCacheConfig,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redis = module.get<DeepMocked<Redis>>(REDIS_CLIENT);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return null on a cache miss', async () => {
      // given
      redis.get.mockResolvedValue(null);

      // when
      const result = await service.get('missing');

      // then
      expect(result).toBeNull();
      expect(redis.get).toHaveBeenCalledWith('missing');
    });

    it('should parse the stored JSON value', async () => {
      // given
      redis.get.mockResolvedValue('{"id":"1"}');

      // when
      const result = await service.get('user:1');

      // then
      expect(result).toEqual({ id: '1' });
      expect(redis.get).toHaveBeenCalledWith('user:1');
    });

    it('should gracefully return null on Redis error without throwing', async () => {
      // given
      redis.get.mockRejectedValue(new Error('connection lost'));

      // when
      const result = await service.get('user:1');

      // then
      expect(result).toBeNull();
      expect(redis.get).toHaveBeenCalledWith('user:1');
    });
  });

  describe('set', () => {
    it('should use setex with explicit ttl', async () => {
      // given
      const key = 'user:1';
      const value = { id: '1' };
      const ttl = 60;

      // when
      await service.set(key, value, ttl);

      // then
      expect(redis.setex).toHaveBeenCalledWith(key, ttl, '{"id":"1"}');
    });

    it('should use setex with default ttl when no ttl is given', async () => {
      // given
      const key = 'user:1';
      const value = { id: '1' };

      // when
      await service.set(key, value);

      // then
      expect(redis.setex).toHaveBeenCalledWith(key, 60, '{"id":"1"}');
    });

    it('should gracefully handle Redis error without throwing', async () => {
      // given
      redis.setex.mockRejectedValue(new Error('connection lost'));

      // when & then
      await expect(
        service.set('user:1', { id: '1' }, 60),
      ).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('should delete specified keys', async () => {
      // given
      const keys = ['user:1', 'user:2'];

      // when
      await service.del(...keys);

      // then
      expect(redis.del).toHaveBeenCalledWith('user:1', 'user:2');
    });

    it('should do nothing when no keys are provided', async () => {
      // when
      await service.del();

      // then
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should gracefully handle Redis error without throwing', async () => {
      // given
      redis.del.mockRejectedValue(new Error('connection lost'));

      // when & then
      await expect(service.del('user:1')).resolves.toBeUndefined();
    });
  });

  describe('delByPrefix', () => {
    it('should scan and delete matching keys', async () => {
      // given
      const prefix = 'users:v1:search:';
      const matchedKeys = ['users:v1:search:foo', 'users:v1:search:bar'];

      redis.scan.mockResolvedValue(['0', matchedKeys]);

      // when
      await service.delByPrefix(prefix);

      // then
      expect(redis.scan).toHaveBeenCalledWith(
        '0',
        'MATCH',
        'users:v1:search:*',
        'COUNT',
        100,
      );
      expect(redis.del).toHaveBeenCalledWith(
        'users:v1:search:foo',
        'users:v1:search:bar',
      );
    });

    it('should do nothing when no keys match the prefix', async () => {
      // given
      redis.scan.mockResolvedValue(['0', []]);

      // when
      await service.delByPrefix('users:v1:search:');

      // then
      expect(redis.scan).toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should gracefully handle Redis error during scan without throwing', async () => {
      // given
      redis.scan.mockRejectedValue(new Error('connection lost'));

      // when & then
      await expect(
        service.delByPrefix('users:v1:search:'),
      ).resolves.toBeUndefined();
    });
  });
});
