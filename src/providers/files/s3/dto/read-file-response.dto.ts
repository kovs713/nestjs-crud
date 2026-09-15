import { IsString } from 'class-validator';

export class ReadFileResponseDto {
  @IsString()
  readonly presignedUrl: string;
}
