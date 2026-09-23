import { Module } from '@nestjs/common';

import { IFileService } from './files.adapter';
import { S3Module } from './s3/s3.module';
import { S3Service } from './s3/s3.service';

@Module({
  providers: [
    {
      provide: IFileService,
      useClass: S3Service,
    },
  ],
  imports: [S3Module],
  exports: [IFileService],
})
export class FilesModule {}
