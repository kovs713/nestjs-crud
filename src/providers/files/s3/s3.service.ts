import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { IFileService } from '../files.adapter';
import {
  DeleteFileDto,
  ReadFileDto,
  ReadFileResponseDto,
  UploadFileDto,
  UploadFileResponseDto,
} from './dto';
import { handleS3Error } from './exceptions';
import type { S3Config } from './s3.config';
import { S3_CLIENT, S3_OPTIONS } from './s3.constants';

@Injectable()
export class S3Service implements IFileService {
  private readonly logger: Logger = new Logger(S3Service.name);

  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    @Inject(S3_OPTIONS) private readonly s3Config: S3Config,
  ) {}

  async uploadFile(dto: UploadFileDto): Promise<UploadFileResponseDto> {
    const { file, folder, name } = dto;
    const key = `${folder}/${name}`;

    const command = new PutObjectCommand({
      Bucket: this.s3Config.bucketName,
      Key: key,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    });

    this.logger.log(`Uploading file to: ${key}`);

    try {
      await this.s3Client.send(command);

      this.logger.log(`Succesfully uploaded: ${key}`);

      return { path: key };
    } catch (error: unknown) {
      handleS3Error(error, 'upload file', this.logger);
    }
  }

  async deleteFile(dto: DeleteFileDto): Promise<void> {
    const { key } = dto;

    const command = new DeleteObjectCommand({
      Bucket: this.s3Config.bucketName,
      Key: key,
    });

    this.logger.log(`Deleting file: ${key}`);

    try {
      await this.s3Client.send(command);

      this.logger.log(`Succesfully deleted: ${key}`);
    } catch (error: unknown) {
      handleS3Error(error, 'delete file', this.logger);
    }
  }

  async readFile(dto: ReadFileDto): Promise<ReadFileResponseDto> {
    const { key } = dto;

    const command = new GetObjectCommand({
      Bucket: this.s3Config.bucketName,
      Key: key,
    });

    this.logger.log(`Getting file: ${key}`);

    try {
      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3Config.presignedTtl,
      });

      this.logger.log(`Succesfully get presigned url: ${key}`);

      return { presignedUrl };
    } catch (error: unknown) {
      handleS3Error(error, 'get presigned url', this.logger);
    }
  }
}
