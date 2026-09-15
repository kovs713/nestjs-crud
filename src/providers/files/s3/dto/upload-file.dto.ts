import { IsNotEmpty, IsString } from 'class-validator';

import type { IUploadedMulterFile } from '../interfaces/uploaded-multer-file.interface';

export class UploadFileDto {
  @IsNotEmpty()
  readonly file: IUploadedMulterFile;

  @IsString()
  @IsNotEmpty()
  readonly folder: string;

  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
