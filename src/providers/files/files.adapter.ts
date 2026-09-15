export abstract class IFileService {
  abstract uploadFile(dto: UploadFileDto): Promise<UploadFileResponseDto>;

  abstract deleteFile(dto: DeleteFileDto): Promise<void>;

  abstract readFile(dto: ReadFileDto): Promise<ReadFileResponseDto>;
}
