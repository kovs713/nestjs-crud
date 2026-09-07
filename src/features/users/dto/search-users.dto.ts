import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SearchUsersDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive substring match on login',
    example: 'john',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  login?: string;

  @ApiPropertyOptional({
    description: 'Page size (1-100)',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Number of users to skip',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset: number = 0;
}
