import { ApiProperty } from '@nestjs/swagger';

import type { RawUser, UserRole } from '../types/users.types';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  login: string;

  @ApiProperty()
  role: UserRole;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty({ nullable: true })
  age: number | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toUserResponse(user: RawUser): UserResponseDto {
  return {
    id: user.id,
    login: user.login,
    role: user.role,
    email: user.email,
    age: user.age,
    description: user.description,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
