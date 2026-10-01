import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional } from 'class-validator';

import { validateConfig } from '@/config';

export type QueueConfig = {
  dbIndex: number;
  defaultAttempts: number;
  removeCompletedAgeDays: number;
  removeFailedAgeDays: number;
};

class EnvironmentVariableValidator {
  @IsInt()
  @IsOptional()
  QUEUE_DB_INDEX?: number;

  @IsInt()
  @IsOptional()
  QUEUE_DEFAULT_ATTEMPTS?: number;

  @IsInt()
  @IsOptional()
  QUEUE_REMOVE_COMPLETED_AGE_DAYS?: number;

  @IsInt()
  @IsOptional()
  QUEUE_REMOVE_FAILED_AGE_DAYS?: number;
}

export default registerAs<QueueConfig>('queue', () => {
  const validatedConfig = validateConfig(
    process.env,
    EnvironmentVariableValidator,
  );

  return {
    dbIndex: validatedConfig.QUEUE_DB_INDEX ?? 1,
    defaultAttempts: validatedConfig.QUEUE_DEFAULT_ATTEMPTS ?? 3,
    removeCompletedAgeDays:
      validatedConfig.QUEUE_REMOVE_COMPLETED_AGE_DAYS ?? 7,
    removeFailedAgeDays: validatedConfig.QUEUE_REMOVE_FAILED_AGE_DAYS ?? 30,
  };
});
