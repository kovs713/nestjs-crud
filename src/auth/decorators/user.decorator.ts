import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

import type { RequestWithUser } from '@/common/types';
import type { JwtPayloadType } from '../types';

export const User = createParamDecorator(
  (data: keyof JwtPayloadType | undefined, ctx: ExecutionContext) => {
    const req = ctx
      .switchToHttp()
      .getRequest<RequestWithUser<JwtPayloadType>>();
    return data ? req.user[data] : req.user;
  },
);
