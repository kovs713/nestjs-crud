import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

import {
  BALANCE_JOBS,
  BALANCE_QUEUE,
  BALANCE_SCHEDULERS,
  CRON_PATTERNS,
} from './balance.constants';

@Injectable()
export class BalanceCronService implements OnModuleInit {
  private readonly logger: Logger = new Logger(BalanceCronService.name);

  constructor(@InjectQueue(BALANCE_QUEUE) private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      BALANCE_SCHEDULERS.TEN_MINUTE_RESET,
      {
        pattern: CRON_PATTERNS.EVERY_TEN_MINUTE,
        tz: 'Europe/Moscow',
      },
      {
        name: BALANCE_JOBS.RESET_ALL,
        data: {
          triggeredBy: 'cron',
        },
        opts: {
          removeOnComplete: true,
        },
      },
    );

    this.logger.log(
      `Upserted scheduler: ${BALANCE_SCHEDULERS.TEN_MINUTE_RESET}`,
    );
  }
}
