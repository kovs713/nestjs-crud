import { SetMetadata } from '@nestjs/common';

const DEFAULT_TTL_SECONDS = 24 * 60 * 60;
export const IDEMPOTENT_KEY = 'idempotent_ttl';

export const Idempotent = (ttlSeconds: number = DEFAULT_TTL_SECONDS) =>
  SetMetadata(IDEMPOTENT_KEY, ttlSeconds);
