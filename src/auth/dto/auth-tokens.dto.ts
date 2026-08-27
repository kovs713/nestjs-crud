import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '@/users/dto';

export class AuthTokensDto {
  /** JWT access token; send it as `Authorization: Bearer <token>`. */
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  /** The authenticated user. Refresh token is delivered as an http-only cookie, not here. */
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
