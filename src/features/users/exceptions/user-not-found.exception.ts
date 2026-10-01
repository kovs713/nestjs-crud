import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotFoundException extends HttpException {
  constructor(userId?: string) {
    super(
      userId ? `User ${userId} not found` : 'User not found',
      HttpStatus.NOT_FOUND,
    );
  }
}
