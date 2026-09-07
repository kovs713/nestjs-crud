import { RequestWithUser } from '@/common/types';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { RawUser } from '../types/users.types';

export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: RequestWithUser<RawUser> = context
      .switchToHttp()
      .getRequest();
    const actor = request.user;
    const id = request.params.id;
    if (actor.id !== id && actor.role !== 'admin') {
      throw new ForbiddenException();
    }

    return true;
  }
}
