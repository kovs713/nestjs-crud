import { ApiProperty } from '@nestjs/swagger';

export class AvatarResponseDto {
  @ApiProperty({
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    format: 'uuid',
  })
  readonly id: string;

  @ApiProperty({
    example: 'https://s3.example.com/avatars/a.jpg?X-Amz-Signature=abc',
  })
  readonly presignedUrl: string;
}
