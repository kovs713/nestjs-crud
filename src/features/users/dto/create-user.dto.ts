import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

import { usersRole } from '../entities';
import type { InsertUser, UserRole } from '../types/users.types';

export class CreateUserDto implements Omit<
  InsertUser,
  'id' | 'passwordHash' | 'createdAt' | 'updatedAt' | 'deletedAt'
> {
  @ApiProperty({ example: 'john_doe', minLength: 6, maxLength: 30 })
  @IsString()
  @Length(6, 30)
  login: string;

  @ApiProperty({ example: 's3cr3t-p4ssword', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: usersRole.enumValues, default: 'user' })
  @IsIn(usersRole.enumValues)
  role: UserRole;

  @ApiPropertyOptional({ example: 'john@example.com', nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 25, nullable: true })
  @IsOptional()
  @IsInt()
  age?: number;

  @ApiPropertyOptional({
    example: 'Backend developer from Prague',
    maxLength: 1000,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
