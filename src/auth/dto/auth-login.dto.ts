import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class AuthLoginDto {
  @ApiPropertyOptional({ example: 'john@example.com', format: 'email' })
  @IsOptional()
  @IsEmail()
  readonly email: string;

  @ApiPropertyOptional({ example: 'john_doe', minLength: 6, maxLength: 30 })
  @IsOptional()
  @IsString()
  @Length(6, 30)
  readonly login: string;

  @ApiProperty({ example: 's3cr3t-p4ssword', minLength: 8, maxLength: 30 })
  @IsNotEmpty()
  @IsString()
  @Length(8, 30)
  readonly password: string;
}
