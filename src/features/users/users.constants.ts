export const USER_SEARCH_CACHE_PREFIX = 'users:v1:search:';
export const USER_ACTIVE_CACHE_PREFIX = 'users:v1:active:';

export const USER_CACHE_KEY = (id: string) => `users:v1:user:${id}`;
export const USER_SEARCH_CACHE_KEY = (dto: unknown) =>
  `users:v1:search:${JSON.stringify(dto)}`;
export const USER_ACTIVE_CACHE_KEY = (dto: unknown) =>
  `users:v1:active:${JSON.stringify(dto)}`;

export const CACHE_TTL_USER = 300;
export const CACHE_TTL_LIST = 60;
