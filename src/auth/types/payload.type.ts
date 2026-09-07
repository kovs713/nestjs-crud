import { RawUser } from '@/features/users/types/users.types';

export type TokenType = 'access' | 'refresh';

export type JwtPayloadType = Pick<RawUser, 'id' | 'role'> & {
  type: TokenType;
  iat: number;
  exp: number;
};

export type JwtClaims = Pick<JwtPayloadType, 'id' | 'role' | 'type'>;
