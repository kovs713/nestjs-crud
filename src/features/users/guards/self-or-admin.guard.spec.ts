import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import type { JwtPayloadType } from '@/auth/types';
import { SelfOrAdminGuard } from './self-or-admin.guard';

describe('SelfOrAdminGuard', () => {
  const guard = new SelfOrAdminGuard();

  it.each([
    { role: 'user', targetId: 'self', allowed: true },
    { role: 'user', targetId: 'other', allowed: false },
    { role: 'admin', targetId: 'self', allowed: true },
    { role: 'admin', targetId: 'other', allowed: true },
  ] as const)(
    '$role accessing $targetId: allowed=$allowed',
    ({ role, targetId, allowed }) => {
      const user: JwtPayloadType = {
        id: 'self',
        role,
        type: 'access',
        iat: 0,
        exp: 1,
      };
      const context = createMock<ExecutionContext>();
      context.switchToHttp().getRequest.mockReturnValue({
        user,
        params: { id: targetId },
      });

      if (allowed) {
        expect(guard.canActivate(context)).toBe(true);
      } else {
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      }
    },
  );
});
