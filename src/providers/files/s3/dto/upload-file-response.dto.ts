import { IsNotEmpty, IsString } from 'class-validator';

export class UploadFileResponseDto {
  @IsString()
  @IsNotEmpty()
  readonly path: string;
}
