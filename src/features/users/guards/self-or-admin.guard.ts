import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import type { JwtPayloadType } from '@/auth/types';
import type { RequestWithUser } from '@/common/types';

export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithUser<JwtPayloadType>>();
    const actor = request.user;
    const id = request.params.id;
    if (actor.id !== id && actor.role !== 'admin') {
      throw new ForbiddenException();
    }

    return true;
  }
}
