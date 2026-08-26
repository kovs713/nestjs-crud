import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RequestWithUser } from '@/common/types';
import type { UserRole } from '@/features/users/types/users.types';
import { ROLES_KEY } from '../decorators';
import { JwtPayloadType } from '../types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roles?.length) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<RequestWithUser<JwtPayloadType>>();

    if (!roles.includes(user.role)) throw new ForbiddenException();

    return true;
  }
}
