import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '@/features/users/dto';

export class AuthTokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: UserResponseDto;
}
