import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class SearchActiveUsersDto {
  @ApiPropertyOptional({
    description: 'Minimum age, inclusive',
    example: 18,
    minimum: 0,
    maximum: 150,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  readonly minAge?: number;

  @ApiPropertyOptional({
    description: 'Maximum age, inclusive',
    example: 99,
    minimum: 0,
    maximum: 150,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  readonly maxAge?: number;

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
  readonly limit: number = 20;

  @ApiPropertyOptional({
    description: 'Number of users to skip',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly offset: number = 0;
}
