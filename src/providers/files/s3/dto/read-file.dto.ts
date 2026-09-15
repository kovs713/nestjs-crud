import { IsNotEmpty, IsString } from 'class-validator';

export class ReadFileDto {
  @IsNotEmpty()
  @IsString()
  readonly key: string;
}
