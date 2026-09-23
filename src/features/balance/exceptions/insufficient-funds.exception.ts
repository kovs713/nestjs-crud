import { HttpException, HttpStatus } from '@nestjs/common';

export class InsufficientFundsException extends HttpException {
  constructor(currentBalance: number, requestedAmount: number) {
    super(
      `Insufficient funds. Current balance: $${currentBalance.toFixed(2)}, ` +
        `requested: $${requestedAmount.toFixed(2)}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
