import { DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';

// postgresql error code
const UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof DrizzleQueryError &&
    error.cause instanceof DatabaseError &&
    error.cause.code === UNIQUE_VIOLATION
  );
}
