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
  @IsString()
  @Length(6, 30)
  login: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn(usersRole.enumValues)
  role: UserRole;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsInt()
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
