import { S3 } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AllConfigType } from '@/config';
import { S3Config } from './s3.config';
import { S3_CLIENT, S3_OPTIONS } from './s3.constants';
import { S3Service } from './s3.service';

@Module({
  imports: [],
  providers: [
    {
      provide: S3_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>): S3Config => ({
        host: config.getOrThrow<string>('s3.host', { infer: true }),
        port: config.getOrThrow('s3.port', { infer: true }),
        accessKey: config.getOrThrow<string>('s3.accessKey', { infer: true }),
        secretKey: config.getOrThrow<string>('s3.secretKey', { infer: true }),
        bucketName: config.getOrThrow<string>('s3.bucketName', { infer: true }),
        region: config.getOrThrow<string>('s3.region', { infer: true }),
        useSsl: config.getOrThrow('s3.useSsl', { infer: true }),
      }),
    },
    {
      provide: S3_CLIENT,
      inject: [S3_OPTIONS],
      useFactory: (config: S3Config) => {
        const protocol = config.useSsl ? 'https' : 'http';
        const endpoint = `${protocol}://${config.host}:${config.port}`;

        const s3Client = new S3({
          endpoint: endpoint,
          region: config.region,
          credentials: {
            accessKeyId: config.accessKey,
            secretAccessKey: config.secretKey,
          },
        });

        return s3Client;
      },
    },
    S3Service,
  ],
  exports: [S3Service, S3_OPTIONS, S3_CLIENT],
})
export class S3Module {}
