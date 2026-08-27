import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { from, Observable, of, switchMap, tap } from 'rxjs';

import { REDIS_CLIENT } from '@/providers/cache/cache.constants';
import { IDEMPOTENT_KEY } from './idempotency.decorator';

const HEADER = 'idempotency-key';
const PROCESSING = '__processing__';
type StoredResponse = { statusCode: number; body: unknown };

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ttl = this.reflector.getAllAndOverride<number | undefined>(
      IDEMPOTENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const req = context.switchToHttp().getRequest<Request>();
    const clientKey = req.header(HEADER);

    if (ttl === undefined || !clientKey) return next.handle();

    const res = context.switchToHttp().getResponse<Response>();
    const key = `idem:${req.method}:${req.path}:${clientKey}`;

    return from(this.claim(key, ttl)).pipe(
      switchMap((stored) => {
        if (stored) {
          res.status(stored.statusCode);
          return of(stored.body);
        }

        return next.handle().pipe(
          tap({
            next: (body) =>
              void this.store(key, ttl, { statusCode: res.statusCode, body }),
            error: () => void this.redis.del(key),
          }),
        );
      }),
    );
  }

  private async claim(
    key: string,
    ttl: number,
  ): Promise<StoredResponse | null> {
    const claimed = await this.redis.set(key, PROCESSING, 'EX', ttl, 'NX');
    if (claimed) return null;

    const stored = await this.redis.get(key);
    if (stored && stored !== PROCESSING) {
      return JSON.parse(stored) as StoredResponse;
    }

    throw new ConflictException(
      'A request with this Idempotency-Key is already being processed',
    );
  }

  private async store(
    key: string,
    ttl: number,
    value: StoredResponse,
  ): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }
}
