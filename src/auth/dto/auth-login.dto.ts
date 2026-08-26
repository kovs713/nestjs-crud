import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class AuthLoginDto {
  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(6, 30)
  login: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Length(8, 30)
  password: string;
}
