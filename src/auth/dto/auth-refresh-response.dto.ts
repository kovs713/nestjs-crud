import { ApiProperty } from '@nestjs/swagger';

export class AuthRefreshResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  readonly accessToken: string;
}
