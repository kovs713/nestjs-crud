import { DeleteFileDto } from './s3/dto/delete-file.dto';
import { ReadFileResponseDto } from './s3/dto/read-file-response.dto';
import { ReadFileDto } from './s3/dto/read-file.dto';
import { UploadFileResponseDto } from './s3/dto/upload-file-response.dto';
import { UploadFileDto } from './s3/dto/upload-file.dto';

export abstract class IFileService {
  abstract uploadFile(dto: UploadFileDto): Promise<UploadFileResponseDto>;

  abstract deleteFile(dto: DeleteFileDto): Promise<void>;

  abstract readFile(dto: ReadFileDto): Promise<ReadFileResponseDto>;
}
