import type { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { generateFileMock } from './__mocks__/generate-file-mock';
import { S3_CLIENT, S3_OPTIONS } from './s3.constants';
import type { S3Config } from './s3.config';
import { S3Service } from './s3.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('S3Service', () => {
  let service: S3Service;
  let s3: DeepMocked<S3Client>;
  const mockedGetSignedUrl = jest.mocked(getSignedUrl);

  const config = {
    bucketName: 'test-bucket',
    presignedTtl: 3600,
  } as S3Config;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        { provide: S3_OPTIONS, useValue: config },
        { provide: S3_CLIENT, useValue: createMock<S3Client>() },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    s3 = module.get<DeepMocked<S3Client>>(S3_CLIENT);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('puts object under folder/name and returns path', async () => {
      // given
      // :s3 send resolves

      // when
      const uploaded = await service.uploadFile({
        file: generateFileMock(),
        folder: 'avatars',
        name: 'a.jpg',
      });

      // then
      expect(uploaded).toEqual({ path: 'avatars/a.jpg' });
      expect(s3.send.mock.calls[0][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'avatars/a.jpg',
      });
    });

    it('throws when s3 fails', async () => {
      // given
      // :s3 send fails
      s3.send.mockRejectedValueOnce(new Error('boom') as never);

      // when
      const attempt = service.uploadFile({
        file: generateFileMock(),
        folder: 'avatars',
        name: 'a.jpg',
      });

      // then
      await expect(attempt).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('deletes by key', async () => {
      // when
      await service.deleteFile({ key: 'avatars/a.jpg' });

      // then
      expect(s3.send.mock.calls[0][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'avatars/a.jpg',
      });
    });
  });

  describe('readFile', () => {
    it('returns presigned url', async () => {
      // given
      mockedGetSignedUrl.mockResolvedValueOnce('https://s3/a.jpg');

      // when
      const result = await service.readFile({ key: 'avatars/a.jpg' });

      // then
      expect(result).toEqual({ presignedUrl: 'https://s3/a.jpg' });
    });
  });
});
