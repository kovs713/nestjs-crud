import { ApiProperty } from '@nestjs/swagger';

export class ResetAllResponseDto {
  @ApiProperty({
    example: 'reset-all:a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  readonly jobId: string;
}
