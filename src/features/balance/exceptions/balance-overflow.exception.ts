import { HttpException, HttpStatus } from '@nestjs/common';

export class BalanceOverflowException extends HttpException {
  constructor() {
    super(
      'Transfer would exceed maximum balance limit',
      HttpStatus.BAD_REQUEST,
    );
  }
}
