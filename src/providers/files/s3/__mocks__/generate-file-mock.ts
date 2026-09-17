import { IUploadedMulterFile } from '../interfaces/uploaded-multer-file.interface';

export function generateFileMock(size = 1024 * 1024): IUploadedMulterFile {
  return {
    fieldname: 'imageUpload',
    originalname: 'sample.jpg',
    encoding: 'jpeg',
    mimetype: 'image/png',
    buffer: Buffer.alloc(size),
    size,
  };
}
