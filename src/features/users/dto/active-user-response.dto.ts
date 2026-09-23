import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from './user-response.dto';

export class ActiveUserResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'ID of the most recently uploaded avatar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  readonly lastAvatarId: string;
}
