import { ApiProperty } from '@nestjs/swagger';

import type { RawUser, UserRole } from '../types/users.types';

export class UserResponseDto {
  @ApiProperty({
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    format: 'uuid',
  })
  readonly id: string;

  @ApiProperty({ example: 'john_doe' })
  readonly login: string;

  @ApiProperty({ enum: ['user', 'admin'] })
  readonly role: UserRole;

  @ApiProperty({ nullable: true, example: 'john@example.com' })
  readonly email: string | null;

  @ApiProperty({ nullable: true, example: 25 })
  readonly age: number | null;

  @ApiProperty({
    nullable: true,
    example: 'Backend developer from Prague',
  })
  readonly description: string | null;

  readonly avatarsCount: number;

  @ApiProperty({ format: 'date-time', example: '2026-08-26T12:00:00.000Z' })
  readonly createdAt: Date;

  @ApiProperty({ format: 'date-time', example: '2026-08-26T12:00:00.000Z' })
  readonly updatedAt: Date;
}

export function toUserResponse(user: RawUser): UserResponseDto {
  return {
    id: user.id,
    login: user.login,
    role: user.role,
    email: user.email,
    age: user.age,
    description: user.description,
    avatarsCount: user.avatarsCount,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
