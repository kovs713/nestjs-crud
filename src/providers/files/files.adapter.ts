import { UploadFileDto } from './s3/dto';

export abstract class IFileService {
  abstract uploadFile(dto: UploadFileDto): Promise<void>;

  abstract deleteFile(key: string): Promise<void>;

  abstract readFile(key: string): Promise<string>;
}
