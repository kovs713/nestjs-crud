import type { IUploadedMulterFile } from '../interfaces/uploaded-multer-file.interface';

export class UploadFileDto {
  readonly file: IUploadedMulterFile;

  readonly folder: string;

  readonly name: string;
}
