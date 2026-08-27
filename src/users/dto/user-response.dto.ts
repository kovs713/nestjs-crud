import { ApiProperty } from '@nestjs/swagger';

import type { RawUser, UserRole } from '../types/users.types';

export class UserResponseDto {
  @ApiProperty({
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  login: string;

  @ApiProperty({ enum: ['user', 'admin'] })
  role: UserRole;

  @ApiProperty({ nullable: true, example: 'john@example.com' })
  email: string | null;

  @ApiProperty({ nullable: true, example: 25 })
  age: number | null;

  @ApiProperty({
    nullable: true,
    example: 'Backend developer from Prague',
  })
  description: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-08-26T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time', example: '2026-08-26T12:00:00.000Z' })
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
