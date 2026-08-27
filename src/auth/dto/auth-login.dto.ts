import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class AuthLoginDto {
  /** Email to log in with. Provide either this or `login`. */
  @ApiPropertyOptional({ example: 'john@example.com', format: 'email' })
  @IsOptional()
  @IsEmail()
  email: string;

  /** Login name to log in with. Provide either this or `email`. */
  @ApiPropertyOptional({ example: 'john_doe', minLength: 6, maxLength: 30 })
  @IsOptional()
  @IsString()
  @Length(6, 30)
  login: string;

  /** Account password (8-30 characters). */
  @ApiProperty({ example: 's3cr3t-p4ssword', minLength: 8, maxLength: 30 })
  @IsNotEmpty()
  @IsString()
  @Length(8, 30)
  password: string;
}
