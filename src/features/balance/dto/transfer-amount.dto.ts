import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class TransferAmountDto {
  @ApiProperty({
    description: 'Amount in dollars (e.g., 20.51)',
    example: 20.51,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  readonly amount: number;
}
