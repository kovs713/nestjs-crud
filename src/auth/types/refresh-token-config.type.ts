import type { CookieOptions } from 'express';

export type RefreshTokenConfig = {
  name: string;
  options: CookieOptions;
};
