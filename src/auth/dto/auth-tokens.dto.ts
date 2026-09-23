import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '@/features/users/dto';

export class AuthTokensDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  readonly accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  readonly user: UserResponseDto;
}
