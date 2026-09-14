import type { CookieOptions } from 'express';

export interface RefreshTokenConfig {
  name: string;
  options: CookieOptions;
}
