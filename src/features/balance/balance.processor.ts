import { WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { BalanceJobName } from './balance.constants';
import { BalanceJobPayload } from './types';

@Injectable()
export class BalanceProcessor extends WorkerHost {
  private readonly logger: Logger = new Logger(BalanceProcessor.name);

  constructor() {
    super();
  }

  async process(
    job: Job<BalanceJobPayload[BalanceJobName], any, BalanceJobName>,
  ): Promise<void> {
    this.logger.log(
      `Processing job: ${job.name}. (id: ${job.id}, by: ${job.data.triggeredBy})`,
    );

    return new Promise(() => console.log(job.data));
  }
}
